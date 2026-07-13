from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import uuid
import json

from app.models.maintenance import (
    MaintenanceAsset, EquipmentMaster, AssetHierarchy, MaintenancePlan,
    MaintenanceCalendar, MaintenanceRequest, MaintenanceWorkOrder,
    TechnicianAssignment, MaintenanceInspection, InspectionChecklist,
    SparePartsConsumption, MaintenanceHistory, AssetHealth, PredictiveAlert,
    MaintenanceCost, ReliabilityMetric, MaintenanceAnalytics,
    MaintenanceTimeline, MaintenanceAuditLog
)
from app.repositories.maintenance import (
    MaintenanceAssetRepository, EquipmentMasterRepository, AssetHierarchyRepository,
    MaintenancePlanRepository, MaintenanceCalendarRepository, MaintenanceRequestRepository,
    MaintenanceWorkOrderRepository, TechnicianAssignmentRepository, MaintenanceInspectionRepository,
    MaintenanceHistoryRepository, AssetHealthRepository, PredictiveAlertRepository,
    MaintenanceCostRepository
)
from app.repositories.inventory import InventoryItemRepository, WarehouseRepository
from app.services.inventory import InventoryService
from app.schemas.inventory import StockOutSchema

from app.schemas.maintenance import (
    AssetCreateSchema, EquipmentCreateSchema, HierarchyCreateSchema,
    PlanCreateSchema, CalendarCreateSchema, RequestSubmitSchema,
    WorkOrderCreateSchema, TechnicianCreateSchema, InspectionSubmitSchema,
    ChecklistTemplateCreateSchema, SpareConsumptionSubmitSchema, TelemetrySubmitSchema
)

# Repository instances
asset_repo = MaintenanceAssetRepository()
equipment_repo = EquipmentMasterRepository()
hierarchy_repo = AssetHierarchyRepository()
plan_repo = MaintenancePlanRepository()
calendar_repo = MaintenanceCalendarRepository()
request_repo = MaintenanceRequestRepository()
wo_repo = MaintenanceWorkOrderRepository()
tech_repo = TechnicianAssignmentRepository()
inspection_repo = MaintenanceInspectionRepository()
history_repo = MaintenanceHistoryRepository()
health_repo = AssetHealthRepository()
alert_repo = PredictiveAlertRepository()
cost_repo = MaintenanceCostRepository()

item_repo = InventoryItemRepository()
warehouse_repo = WarehouseRepository()

class MaintenanceService:
    # ── Asset & Equipment Registry ──
    @staticmethod
    def create_asset(db: Session, payload: AssetCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = asset_repo.get_by_code(db, payload.assetCode, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Asset code already exists")
        
        plant_uuid = uuid.UUID(payload.plantId) if payload.plantId else None
        p_date = datetime.strptime(payload.purchaseDate, "%Y-%m-%d") if payload.purchaseDate else datetime.utcnow()
        i_date = datetime.strptime(payload.installationDate, "%Y-%m-%d") if payload.installationDate else datetime.utcnow()
        w_date = datetime.strptime(payload.warrantyExpiry, "%Y-%m-%d") if payload.warrantyExpiry else None

        asset = MaintenanceAsset(
            tenant_id=tenant_id,
            asset_code=payload.assetCode,
            name=payload.name,
            category=payload.category,
            manufacturer=payload.manufacturer,
            model=payload.model,
            serial_number=payload.serialNumber,
            purchase_date=p_date,
            installation_date=i_date,
            warranty_expiry=w_date,
            status=payload.status or "active",
            plant_id=plant_uuid,
            department=payload.department
        )
        db.add(asset)
        db.flush()

        # Log default asset health score
        health = AssetHealth(
            tenant_id=tenant_id,
            asset_id=asset.id,
            health_score=100.0,
            operating_hours=0.0,
            runtime_hours=0.0,
            downtime_hours=0.0,
            temperature=20.0,
            vibration=0.10,
            power_consumption=1.0
        )
        db.add(health)

        # Log timeline event
        history = MaintenanceHistory(
            tenant_id=tenant_id,
            asset_id=asset.id,
            event_type="installed",
            details=f"Asset {asset.name} registered and initialized in database."
        )
        db.add(history)

        db.commit()
        db.refresh(asset)
        return {
            "_id": str(asset.id),
            "assetCode": asset.asset_code,
            "name": asset.name,
            "category": asset.category,
            "status": asset.status
        }

    @staticmethod
    def list_assets(db: Session, tenant_id: uuid.UUID) -> list:
        assets = db.query(MaintenanceAsset).filter(
            MaintenanceAsset.tenant_id == tenant_id,
            MaintenanceAsset.deleted_at == None
        ).all()
        return [{
            "_id": str(a.id),
            "assetCode": a.asset_code,
            "name": a.name,
            "category": a.category,
            "manufacturer": a.manufacturer,
            "model": a.model,
            "status": a.status,
            "department": a.department
        } for a in assets]

    # ── PM Plans & Calendars ──
    @staticmethod
    def create_pm_plan(db: Session, payload: PlanCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = plan_repo.get_by_number(db, payload.planNumber, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Plan number already exists")

        asset_uuid = uuid.UUID(payload.assetId)
        plan = MaintenancePlan(
            tenant_id=tenant_id,
            plan_number=payload.planNumber,
            asset_id=asset_uuid,
            maintenance_type=payload.maintenanceType or "preventive",
            frequency=payload.frequency or "monthly",
            checklist=payload.checklist,
            estimated_duration=payload.estimatedDuration or 1.0,
            safety_instructions=payload.safetyInstructions
        )
        db.add(plan)
        db.flush()

        # Pre-schedule standard occurrences in calendar (1 year period)
        start_date = datetime.utcnow()
        interval_days = 30 # default monthly
        if plan.frequency == "daily":
            interval_days = 1
        elif plan.frequency == "weekly":
            interval_days = 7
        elif plan.frequency == "quarterly":
            interval_days = 90
        elif plan.frequency == "annual":
            interval_days = 365

        for i in range(1, 4): # Pre-schedule next 3 occurrences
            sched_date = start_date + timedelta(days=interval_days * i)
            cal_slot = MaintenanceCalendar(
                tenant_id=tenant_id,
                plan_id=plan.id,
                asset_id=asset_uuid,
                scheduled_date=sched_date,
                status="scheduled"
            )
            db.add(cal_slot)

        db.commit()
        db.refresh(plan)
        return {
            "_id": str(plan.id),
            "planNumber": plan.plan_number,
            "frequency": plan.frequency
        }

    # ── Maintenance Work Requests ──
    @staticmethod
    def submit_work_request(db: Session, payload: RequestSubmitSchema, tenant_id: uuid.UUID) -> dict:
        asset_uuid = uuid.UUID(payload.assetId)
        asset = db.query(MaintenanceAsset).filter(MaintenanceAsset.id == asset_uuid, MaintenanceAsset.tenant_id == tenant_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        count = db.query(MaintenanceRequest).filter(MaintenanceRequest.tenant_id == tenant_id).count()
        req_number = f"REQ-{count + 1:04d}"

        req = MaintenanceRequest(
            tenant_id=tenant_id,
            request_number=req_number,
            asset_id=asset_uuid,
            requester_email="technician@worksphere.com", # Mock requester
            department=payload.department or asset.department,
            problem_description=payload.problemDescription,
            priority=payload.priority or "medium",
            status="pending"
        )
        db.add(req)
        db.flush()

        # Timeline
        tl = MaintenanceTimeline(
            tenant_id=tenant_id,
            request_id=req.id,
            event_type="submitted",
            details=f"Maintenance request {req.request_number} logged for asset {asset.name} (Priority: {req.priority})."
        )
        db.add(tl)

        db.commit()
        db.refresh(req)
        return {
            "_id": str(req.id),
            "requestNumber": req.request_number,
            "status": req.status
        }

    # ── Work Orders Execution ──
    @staticmethod
    def create_work_order(db: Session, payload: WorkOrderCreateSchema, tenant_id: uuid.UUID) -> dict:
        asset_uuid = uuid.UUID(payload.assetId)
        asset = db.query(MaintenanceAsset).filter(MaintenanceAsset.id == asset_uuid, MaintenanceAsset.tenant_id == tenant_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        req_uuid = uuid.UUID(payload.requestId) if payload.requestId else None
        plan_uuid = uuid.UUID(payload.planId) if payload.planId else None
        tech_uuid = uuid.UUID(payload.assignedTechnicianId) if payload.assignedTechnicianId else None

        count = db.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.tenant_id == tenant_id).count()
        wo_number = f"WO-MNT-{count + 1:04d}"

        p_start = datetime.strptime(payload.plannedStart, "%Y-%m-%d %H:%M:%S") if payload.plannedStart else datetime.utcnow()
        p_finish = datetime.strptime(payload.plannedFinish, "%Y-%m-%d %H:%M:%S") if payload.plannedFinish else (p_start + timedelta(hours=4))

        wo = MaintenanceWorkOrder(
            tenant_id=tenant_id,
            work_order_number=wo_number,
            asset_id=asset_uuid,
            request_id=req_uuid,
            plan_id=plan_uuid,
            maintenance_type=payload.maintenanceType or "corrective",
            assigned_technician_id=tech_uuid,
            planned_start=p_start,
            planned_finish=p_finish,
            estimated_labor_hours=payload.estimatedLaborHours or 1.0,
            safety_checklist=payload.safetyChecklist,
            status="pending"
        )
        db.add(wo)
        db.flush()

        # Initialize maintenance cost ledger
        m_cost = MaintenanceCost(
            tenant_id=tenant_id,
            work_order_id=wo.id,
            labor_cost=0.0,
            parts_cost=0.0,
            downtime_cost=0.0,
            total_cost=0.0
        )
        db.add(m_cost)

        # Update parent request state
        if req_uuid:
            req = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == req_uuid).first()
            if req:
                req.status = "approved"

        # Log timeline
        tl = MaintenanceTimeline(
            tenant_id=tenant_id,
            work_order_id=wo.id,
            event_type="assigned",
            details=f"Work Order {wo.work_order_number} released and scheduled."
        )
        db.add(tl)

        db.commit()
        db.refresh(wo)
        return {
            "_id": str(wo.id),
            "workOrderNumber": wo.work_order_number,
            "status": wo.status
        }

    # ── Spare Parts Integration (Book 21 stock deduction) ──
    @staticmethod
    def consume_spare_part(db: Session, payload: SpareConsumptionSubmitSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        wo_uuid = uuid.UUID(payload.workOrderId)
        wo = db.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.id == wo_uuid, MaintenanceWorkOrder.tenant_id == tenant_id).first()
        if not wo:
            raise HTTPException(status_code=404, detail="Work Order not found")

        item = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Spare part item code {payload.itemCode} not found in inventory catalog")

        wh = warehouse_repo.get_by_code(db, payload.warehouseCode, tenant_id)
        if not wh:
            raise HTTPException(status_code=404, detail="Warehouse location not found")

        # Deduct from stock
        stock_out_payload = StockOutSchema(
            itemCode=payload.itemCode,
            warehouseCode=payload.warehouseCode,
            locationCode=payload.locationCode,
            quantity=payload.quantityConsumed,
            remarks=f"Consumed during execution of Work Order #{wo.work_order_number}"
        )
        # Call InventoryService.stock_out
        InventoryService.stock_out(db, stock_out_payload, tenant_id, author_email)

        # Record consumed parts ledger
        simulated_cost = payload.quantityConsumed * 150.0 # simulated cost index
        consumption = SparePartsConsumption(
            tenant_id=tenant_id,
            work_order_id=wo.id,
            item_id=item.id,
            quantity_consumed=payload.quantityConsumed,
            cost=simulated_cost
        )
        db.add(consumption)

        # Update cost tracking
        m_cost = db.query(MaintenanceCost).filter(MaintenanceCost.work_order_id == wo.id).first()
        if m_cost:
            m_cost.parts_cost += simulated_cost
            m_cost.total_cost = m_cost.labor_cost + m_cost.parts_cost + m_cost.downtime_cost

        db.commit()
        return {
            "workOrderId": str(wo.id),
            "itemCode": payload.itemCode,
            "quantityConsumed": payload.quantityConsumed,
            "cost": simulated_cost
        }

    # ── Complete Work Order ──
    @staticmethod
    def complete_work_order(db: Session, wo_id: str, labor_cost: float, remarks: str, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        wo_uuid = uuid.UUID(wo_id)
        wo = db.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.id == wo_uuid, MaintenanceWorkOrder.tenant_id == tenant_id).first()
        if not wo:
            raise HTTPException(status_code=404, detail="Work Order not found")

        wo.status = "completed"

        # Resolve parent request status
        if wo.request_id:
            req = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == wo.request_id).first()
            if req:
                req.status = "approved"

        # Update cost sheet details
        m_cost = db.query(MaintenanceCost).filter(MaintenanceCost.work_order_id == wo.id).first()
        actual_cost = 0.0
        if m_cost:
            m_cost.labor_cost = labor_cost
            m_cost.downtime_cost = 100.0 # Simulated breakdown downtime cost
            m_cost.total_cost = m_cost.labor_cost + m_cost.parts_cost + m_cost.downtime_cost
            actual_cost = m_cost.total_cost

        # Log history
        history = MaintenanceHistory(
            tenant_id=tenant_id,
            asset_id=wo.asset_id,
            event_type="work_order",
            details=f"Maintenance Work Order {wo.work_order_number} completed. {remarks or ''}",
            cost=actual_cost
        )
        db.add(history)

        # Log audit log
        aud = MaintenanceAuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="MAINTENANCE_WORK_ORDER_COMPLETED",
            details=f"Completed work order {wo.work_order_number} (Asset ID: {wo.asset_id})"
        )
        db.add(aud)

        # Recalculate MTBF/MTTR reliability averages for the asset
        # Let's count breakdowns/work orders
        total_wo_completed = db.query(MaintenanceWorkOrder).filter(
            MaintenanceWorkOrder.asset_id == wo.asset_id,
            MaintenanceWorkOrder.status == "completed"
        ).count()

        rel = db.query(ReliabilityMetric).filter(
            ReliabilityMetric.asset_id == wo.asset_id,
            ReliabilityMetric.tenant_id == tenant_id
        ).first()

        # Simulating operational parameters update
        breakdowns = db.query(MaintenanceWorkOrder).filter(
            MaintenanceWorkOrder.asset_id == wo.asset_id,
            MaintenanceWorkOrder.maintenance_type == "emergency",
            MaintenanceWorkOrder.status == "completed"
        ).count() or 1

        run_hours = total_wo_completed * 48.0 # Simulated operational runtime hours
        down_hours = total_wo_completed * 2.5  # Simulated downtime hours
        total_hours = run_hours + down_hours

        if not rel:
            rel = ReliabilityMetric(
                tenant_id=tenant_id,
                asset_id=wo.asset_id,
                failures_count=breakdowns,
                total_runtime_hours=run_hours,
                mtbf_hours=run_hours / breakdowns,
                mttr_hours=down_hours / breakdowns,
                availability_rate=(run_hours / total_hours) * 100.0 if total_hours > 0 else 100.0
            )
            db.add(rel)
        else:
            rel.failures_count = breakdowns
            rel.total_runtime_hours = run_hours
            rel.mtbf_hours = run_hours / breakdowns
            rel.mttr_hours = down_hours / breakdowns
            rel.availability_rate = (run_hours / total_hours) * 100.0 if total_hours > 0 else 100.0

        db.commit()
        db.refresh(wo)
        return {
            "_id": str(wo.id),
            "status": wo.status,
            "cost": actual_cost
        }

    # ── Inspection worksheets ──
    @staticmethod
    def submit_inspection(db: Session, payload: InspectionSubmitSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        wo_uuid = uuid.UUID(payload.workOrderId) if payload.workOrderId else None
        asset_uuid = uuid.UUID(payload.assetId)

        count = db.query(MaintenanceInspection).filter(MaintenanceInspection.tenant_id == tenant_id).count()
        insp_number = f"INSP-MNT-{count + 1:04d}"

        inspection = MaintenanceInspection(
            tenant_id=tenant_id,
            inspection_number=insp_number,
            work_order_id=wo_uuid,
            asset_id=asset_uuid,
            stage=payload.stage,
            result=payload.result,
            inspector_email=author_email,
            criteria=payload.criteria,
            remarks=payload.remarks
        )
        db.add(inspection)
        db.flush()

        # Update asset status if inspection failed
        if payload.result == "fail":
            asset = db.query(MaintenanceAsset).filter(MaintenanceAsset.id == asset_uuid).first()
            if asset:
                asset.status = "down"
                # Trigger an alert/history log
                hist = MaintenanceHistory(
                    tenant_id=tenant_id,
                    asset_id=asset_uuid,
                    event_type="breakdown",
                    details=f"Asset failed maintenance inspection check {inspection.inspection_number}. Status updated to down."
                )
                db.add(hist)

        db.commit()
        db.refresh(inspection)
        return {
            "_id": str(inspection.id),
            "inspectionNumber": inspection.inspection_number,
            "result": inspection.result
        }

    # ── Health Scoring & AI Telemetry ──
    @staticmethod
    def update_telemetry(db: Session, payload: TelemetrySubmitSchema, tenant_id: uuid.UUID) -> dict:
        asset_uuid = uuid.UUID(payload.assetId)
        asset = db.query(MaintenanceAsset).filter(MaintenanceAsset.id == asset_uuid, MaintenanceAsset.tenant_id == tenant_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        # Logic: calculate simple health score based on temperature & vibration boundaries
        # Temp warning > 75C, Vibration warning > 0.40
        temp = payload.temperature or 25.0
        vib = payload.vibration or 0.15
        
        health_score = 100.0
        if temp > 75.0:
            health_score -= 20.0
        if vib > 0.40:
            health_score -= 30.0
        
        # Clip minimum score
        health_score = max(10.0, health_score)

        health = AssetHealth(
            tenant_id=tenant_id,
            asset_id=asset_uuid,
            health_score=health_score,
            operating_hours=payload.operatingHours or 8.0,
            runtime_hours=payload.runtimeHours or 8.0,
            downtime_hours=payload.downtimeHours or 0.0,
            temperature=temp,
            vibration=vib,
            power_consumption=payload.powerConsumption or 1.2
        )
        db.add(health)

        # AI Failure warning generation
        ai_alert_created = False
        if health_score < 70.0:
            # Create a predictive alert record
            alert = PredictiveAlert(
                tenant_id=tenant_id,
                asset_id=asset_uuid,
                failure_probability=85.5 if health_score < 60.0 else 65.0,
                remaining_useful_life_days=15.0 if health_score < 60.0 else 45.0,
                recommended_action="Schedule preventive calibration and lubrication overhaul.",
                confidence_score=92.0,
                status="active"
            )
            db.add(alert)
            ai_alert_created = True

        db.commit()
        db.refresh(health)
        return {
            "assetId": str(asset_uuid),
            "healthScore": health.health_score,
            "predictiveAlertCreated": ai_alert_created
        }

    # ── Reliability & MTBF/MTTR Dashboards ──
    @staticmethod
    def get_dashboard(db: Session, tenant_id: uuid.UUID) -> dict:
        total_assets = db.query(MaintenanceAsset).filter(
            MaintenanceAsset.tenant_id == tenant_id,
            MaintenanceAsset.deleted_at == None
        ).count()
        
        active_assets = db.query(MaintenanceAsset).filter(
            MaintenanceAsset.tenant_id == tenant_id,
            MaintenanceAsset.status == "active",
            MaintenanceAsset.deleted_at == None
        ).count()

        pending_work_orders = db.query(MaintenanceWorkOrder).filter(
            MaintenanceWorkOrder.tenant_id == tenant_id,
            MaintenanceWorkOrder.status.in_(["pending", "in_progress"]),
            MaintenanceWorkOrder.deleted_at == None
        ).count()

        pm_compliance = 100.0
        total_pm = db.query(MaintenanceWorkOrder).filter(
            MaintenanceWorkOrder.tenant_id == tenant_id,
            MaintenanceWorkOrder.maintenance_type == "preventive",
            MaintenanceWorkOrder.deleted_at == None
        ).count()
        if total_pm > 0:
            completed_pm = db.query(MaintenanceWorkOrder).filter(
                MaintenanceWorkOrder.tenant_id == tenant_id,
                MaintenanceWorkOrder.maintenance_type == "preventive",
                MaintenanceWorkOrder.status == "completed",
                MaintenanceWorkOrder.deleted_at == None
            ).count()
            pm_compliance = (completed_pm / total_pm) * 100.0

        # Aggregate telemetry averages
        metrics = db.query(ReliabilityMetric).filter(ReliabilityMetric.tenant_id == tenant_id).all()
        avg_availability = sum([m.availability_rate for m in metrics]) / len(metrics) if metrics else 98.4

        return {
            "totalAssets": total_assets,
            "activeAssets": active_assets,
            "pendingWorkOrders": pending_work_orders,
            "pmCompliance": pm_compliance,
            "averageAvailability": avg_availability,
            "failuresCount": sum([m.failures_count for m in metrics]) if metrics else 0
        }
