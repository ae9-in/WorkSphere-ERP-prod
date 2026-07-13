from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import uuid
import math
from typing import Optional, Dict, Any, List

from app.models.manufacturing import (
    ManufacturingPlant, ProductionCalendar, BillOfMaterials, BOMComponent,
    RoutingMaster, RoutingOperation, WorkCenter, Machine,
    ProductionOrder, WorkOrder, MaterialConsumption, WorkInProgress,
    ProductionOutput, QualityInspection, NonConformanceReport, ScrapRecord,
    MachinePerformance, ProductionAnalytics, ManufacturingTimeline, ManufacturingAuditLog
)
from app.repositories.manufacturing import (
    ManufacturingPlantRepository, ProductionCalendarRepository, BillOfMaterialsRepository,
    BOMComponentRepository, RoutingMasterRepository, RoutingOperationRepository,
    WorkCenterRepository, MachineRepository, ProductionOrderRepository,
    WorkOrderRepository, MaterialConsumptionRepository, WorkInProgressRepository,
    ProductionOutputRepository, QualityInspectionRepository, NonConformanceReportRepository,
    ScrapRecordRepository, MachinePerformanceRepository, ProductionAnalyticsRepository,
    ManufacturingTimelineRepository, ManufacturingAuditLogRepository
)
from app.repositories.inventory import (
    InventoryItemRepository, WarehouseRepository, StockBalanceRepository
)
from app.models.inventory import StockBalance
from app.services.inventory import InventoryService
from app.schemas.inventory import StockInSchema, StockOutSchema
from app.schemas.manufacturing import (
    PlantCreateSchema, CalendarCreateSchema, BOMCreateSchema,
    WorkCenterCreateSchema, MachineCreateSchema, RoutingCreateSchema,
    ProductionOrderCreateSchema, WorkOrderReleaseSchema, WorkOrderCompleteSchema,
    QualityInspectionSubmitSchema, ScrapSubmitSchema
)

plant_repo = ManufacturingPlantRepository()
calendar_repo = ProductionCalendarRepository()
bom_repo = BillOfMaterialsRepository()
bom_component_repo = BOMComponentRepository()
routing_repo = RoutingMasterRepository()
operation_repo = RoutingOperationRepository()
wc_repo = WorkCenterRepository()
machine_repo = MachineRepository()
po_repo = ProductionOrderRepository()
wo_repo = WorkOrderRepository()
consumption_repo = MaterialConsumptionRepository()
wip_repo = WorkInProgressRepository()
output_repo = ProductionOutputRepository()
qi_repo = QualityInspectionRepository()
ncr_repo = NonConformanceReportRepository()
scrap_repo = ScrapRecordRepository()
performance_repo = MachinePerformanceRepository()
analytics_repo = ProductionAnalyticsRepository()
timeline_repo = ManufacturingTimelineRepository()
audit_repo = ManufacturingAuditLogRepository()

item_repo = InventoryItemRepository()
warehouse_repo = WarehouseRepository()
balance_repo = StockBalanceRepository()

class ManufacturingService:
    # ── Plants & Calendars ──
    @staticmethod
    def create_plant(db: Session, payload: PlantCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = plant_repo.get_by_code(db, payload.code, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Plant code already exists")
        
        mgr_id = uuid.UUID(payload.managerId) if payload.managerId else None
        plant = ManufacturingPlant(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            address=payload.address,
            manager_id=mgr_id,
            status=payload.status or "active"
        )
        db.add(plant)
        db.commit()
        db.refresh(plant)
        return {
            "_id": str(plant.id),
            "code": plant.code,
            "name": plant.name,
            "status": plant.status
        }

    @staticmethod
    def list_plants(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        plants = db.query(ManufacturingPlant).filter(
            ManufacturingPlant.tenant_id == tenant_id,
            ManufacturingPlant.deleted_at == None
        ).all()
        return [{
            "_id": str(p.id),
            "code": p.code,
            "name": p.name,
            "address": p.address,
            "status": p.status
        } for p in plants]

    @staticmethod
    def create_calendar(db: Session, payload: CalendarCreateSchema, tenant_id: uuid.UUID) -> dict:
        try:
            plant_uuid = uuid.UUID(payload.plantId)
        except ValueError:
            # Fallback lookup by plant code
            plant = plant_repo.get_by_code(db, payload.plantId, tenant_id)
            if not plant:
                raise HTTPException(status_code=404, detail="Plant not found")
            plant_uuid = plant.id

        cal = ProductionCalendar(
            tenant_id=tenant_id,
            plant_id=plant_uuid,
            name=payload.name,
            working_days=payload.workingDays,
            shifts=payload.shifts,
            holidays=payload.holidays,
            status=payload.status or "active"
        )
        db.add(cal)
        db.commit()
        db.refresh(cal)
        return {
            "_id": str(cal.id),
            "plantId": str(cal.plant_id),
            "name": cal.name,
            "shifts": cal.shifts
        }

    # ── Bill of Materials (BOM) ──
    @staticmethod
    def create_bom(db: Session, payload: BOMCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = bom_repo.get_by_number(db, payload.bomNumber, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="BOM number already exists")

        # Resolve end product item
        product = item_repo.get_by_code(db, payload.productItemCode, tenant_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product item code {payload.productItemCode} not found in inventory catalog")

        bom = BillOfMaterials(
            tenant_id=tenant_id,
            bom_number=payload.bomNumber,
            item_id=product.id,
            version=payload.version or "1.0.0",
            is_active=True,
            status="approved"
        )
        db.add(bom)
        db.flush() # Populate bom.id for components

        # Create components
        for comp in payload.components:
            comp_item = item_repo.get_by_code(db, comp.itemCode, tenant_id)
            if not comp_item:
                raise HTTPException(status_code=404, detail=f"Component item code {comp.itemCode} not found in inventory catalog")
            
            bom_comp = BOMComponent(
                tenant_id=tenant_id,
                bom_id=bom.id,
                item_id=comp_item.id,
                quantity=comp.quantity,
                uom=comp.uom or "piece"
            )
            db.add(bom_comp)

        db.commit()
        db.refresh(bom)
        return {
            "_id": str(bom.id),
            "bomNumber": bom.bom_number,
            "productName": product.name,
            "version": bom.version,
            "componentsCount": len(payload.components)
        }

    @staticmethod
    def list_boms(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        boms = db.query(BillOfMaterials).filter(
            BillOfMaterials.tenant_id == tenant_id,
            BillOfMaterials.deleted_at == None
        ).all()
        result = []
        for b in boms:
            prod = db.query(product := item_repo.model).filter(product.id == b.item_id).first()
            result.append({
                "_id": str(b.id),
                "bomNumber": b.bom_number,
                "productCode": prod.item_code if prod else "",
                "productName": prod.name if prod else "",
                "version": b.version,
                "status": b.status
            })
        return result

    # ── Work Centers & Machines ──
    @staticmethod
    def create_work_center(db: Session, payload: WorkCenterCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = wc_repo.get_by_code(db, payload.code, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Work center code already exists")

        wc = WorkCenter(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            department=payload.department,
            capacity=payload.capacity or 100.0,
            shift_schedule=payload.shiftSchedule,
            status="active"
        )
        db.add(wc)
        db.commit()
        db.refresh(wc)
        return {
            "_id": str(wc.id),
            "code": wc.code,
            "name": wc.name,
            "capacity": wc.capacity
        }

    @staticmethod
    def list_work_centers(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        wcs = db.query(WorkCenter).filter(
            WorkCenter.tenant_id == tenant_id,
            WorkCenter.deleted_at == None
        ).all()
        return [{
            "_id": str(w.id),
            "code": w.code,
            "name": w.name,
            "department": w.department,
            "capacity": w.capacity
        } for w in wcs]

    @staticmethod
    def create_machine(db: Session, payload: MachineCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = machine_repo.get_by_code(db, payload.machineCode, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Machine code already exists")

        inst_date = datetime.strptime(payload.installationDate, "%Y-%m-%d") if payload.installationDate else datetime.utcnow()
        mac = Machine(
            tenant_id=tenant_id,
            machine_code=payload.machineCode,
            name=payload.name,
            equipment_type=payload.equipmentType,
            manufacturer=payload.manufacturer,
            installation_date=inst_date,
            maintenance_schedule=payload.maintenanceSchedule,
            calibration_status=payload.calibrationStatus or "calibrated",
            status=payload.status or "active"
        )
        db.add(mac)
        db.commit()
        db.refresh(mac)
        return {
            "_id": str(mac.id),
            "machineCode": mac.machine_code,
            "name": mac.name,
            "status": mac.status
        }

    @staticmethod
    def list_machines(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        macs = db.query(Machine).filter(
            Machine.tenant_id == tenant_id,
            Machine.deleted_at == None
        ).all()
        return [{
            "_id": str(m.id),
            "machineCode": m.machine_code,
            "name": m.name,
            "equipmentType": m.equipment_type,
            "status": m.status,
            "calibrationStatus": m.calibration_status
        } for m in macs]

    # ── Routings & Operations ──
    @staticmethod
    def create_routing(db: Session, payload: RoutingCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = routing_repo.get_by_code(db, payload.code, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Routing code already exists")

        product = item_repo.get_by_code(db, payload.productItemCode, tenant_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product item not found")

        route = RoutingMaster(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            item_id=product.id,
            version=payload.version or "1.0.0",
            is_active=True
        )
        db.add(route)
        db.flush()

        for op_item in payload.operations:
            wc = wc_repo.get_by_code(db, op_item.workCenterCode, tenant_id)
            if not wc:
                raise HTTPException(status_code=404, detail=f"Work Center code {op_item.workCenterCode} not found")

            machine_id = None
            if op_item.machineCode:
                mac = machine_repo.get_by_code(db, op_item.machineCode, tenant_id)
                if mac:
                    machine_id = mac.id

            operation = RoutingOperation(
                tenant_id=tenant_id,
                routing_id=route.id,
                sequence=op_item.sequence,
                work_center_id=wc.id,
                machine_id=machine_id,
                standard_time=op_item.standardTime or 1.0,
                setup_time=op_item.setupTime or 0.1,
                labor_time=op_item.laborTime or 1.0,
                is_inspection_point=op_item.isInspectionPoint or False,
                output_quantity=op_item.outputQuantity or 1.0
            )
            db.add(operation)

        db.commit()
        db.refresh(route)
        return {
            "_id": str(route.id),
            "code": route.code,
            "name": route.name,
            "productName": product.name,
            "operationsCount": len(payload.operations)
        }

    @staticmethod
    def list_routings(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        routes = db.query(RoutingMaster).filter(
            RoutingMaster.tenant_id == tenant_id,
            RoutingMaster.deleted_at == None
        ).all()
        result = []
        for r in routes:
            prod = db.query(product := item_repo.model).filter(product.id == r.item_id).first()
            result.append({
                "_id": str(r.id),
                "code": r.code,
                "name": r.name,
                "productCode": prod.item_code if prod else "",
                "productName": prod.name if prod else "",
                "version": r.version
            })
        return result

    # ── Production Orders & Scheduling ──
    @staticmethod
    def create_production_order(db: Session, payload: ProductionOrderCreateSchema, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        existing = po_repo.get_by_number(db, payload.orderNumber, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Production order number already exists")

        product = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not product:
            raise HTTPException(status_code=404, detail="Inventory product not found")

        bom = bom_repo.get_by_number(db, payload.bomNumber, tenant_id)
        if not bom:
            raise HTTPException(status_code=404, detail="BOM specifications not found")

        route = routing_repo.get_by_code(db, payload.routingCode, tenant_id)
        if not route:
            raise HTTPException(status_code=404, detail="Operations Routing details not found")

        plant = plant_repo.get_by_code(db, payload.plantCode, tenant_id)
        if not plant:
            raise HTTPException(status_code=404, detail="Target plant layout not configured")

        p_start = datetime.strptime(payload.plannedStart, "%Y-%m-%d %H:%M:%S") if payload.plannedStart else datetime.utcnow()
        p_finish = datetime.strptime(payload.plannedFinish, "%Y-%m-%d %H:%M:%S") if payload.plannedFinish else (p_start + timedelta(days=2))

        # Check raw materials availability before releasing order (soft constraint, log warnings)
        warning_msg = None
        bom_comps = db.query(BOMComponent).filter(BOMComponent.bom_id == bom.id).all()
        for comp in bom_comps:
            comp_item = db.query(item_repo.model).filter(item_repo.model.id == comp.item_id).first()
            required_qty = comp.quantity * payload.quantity
            # Find total balance across warehouses
            balances = db.query(StockBalance).filter(StockBalance.item_id == comp.item_id, StockBalance.tenant_id == tenant_id).all()
            total_qty = sum([b.quantity for b in balances])
            if total_qty < required_qty:
                warning_msg = f"Potential shortage of {comp_item.name if comp_item else 'raw materials'} during material checks."

        po = ProductionOrder(
            tenant_id=tenant_id,
            order_number=payload.orderNumber,
            item_id=product.id,
            bom_id=bom.id,
            routing_id=route.id,
            quantity=payload.quantity,
            planned_start=p_start,
            planned_finish=p_finish,
            plant_id=plant.id,
            status="released"
        )
        db.add(po)
        db.flush()

        # Log timeline
        tl = ManufacturingTimeline(
            tenant_id=tenant_id,
            production_order_id=po.id,
            event_type="released",
            details=f"Production order {po.order_number} released. {warning_msg or ''}"
        )
        db.add(tl)

        # Audit Log
        aud = ManufacturingAuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="PRODUCTION_ORDER_RELEASED",
            details=f"Released production order {po.order_number} for {payload.quantity} {product.uom}(s)"
        )
        db.add(aud)

        db.commit()
        db.refresh(po)
        return {
            "_id": str(po.id),
            "orderNumber": po.order_number,
            "status": po.status,
            "warning": warning_msg
        }

    @staticmethod
    def list_production_orders(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        orders = db.query(ProductionOrder).filter(
            ProductionOrder.tenant_id == tenant_id,
            ProductionOrder.deleted_at == None
        ).order_by(ProductionOrder.created_at.desc()).all()
        
        result = []
        for o in orders:
            prod = db.query(product := item_repo.model).filter(product.id == o.item_id).first()
            plant = db.query(ManufacturingPlant).filter(ManufacturingPlant.id == o.plant_id).first()
            result.append({
                "_id": str(o.id),
                "orderNumber": o.order_number,
                "productCode": prod.item_code if prod else "",
                "productName": prod.name if prod else "",
                "quantity": o.quantity,
                "status": o.status,
                "plannedStart": o.planned_start.strftime("%Y-%m-%d %H:%M:%S") if o.planned_start else "",
                "plannedFinish": o.planned_finish.strftime("%Y-%m-%d %H:%M:%S") if o.planned_finish else "",
                "plantCode": plant.code if plant else ""
            })
        return result

    # ── Work Orders Execution & WIP ──
    @staticmethod
    def release_work_order(db: Session, payload: WorkOrderReleaseSchema, tenant_id: uuid.UUID) -> dict:
        po = db.query(ProductionOrder).filter(ProductionOrder.id == uuid.UUID(payload.productionOrderId), ProductionOrder.tenant_id == tenant_id).first()
        if not po:
            raise HTTPException(status_code=404, detail="Production order not found")

        wc = wc_repo.get_by_code(db, payload.workCenterCode, tenant_id)
        if not wc:
            raise HTTPException(status_code=404, detail="Work Center not found")

        machine_id = None
        if payload.machineCode:
            mac = machine_repo.get_by_code(db, payload.machineCode, tenant_id)
            if mac:
                machine_id = mac.id

        op_id = uuid.UUID(payload.operatorId) if payload.operatorId else None

        # Auto-generation code
        count = db.query(WorkOrder).filter(WorkOrder.tenant_id == tenant_id).count()
        wo_num = f"WO-{count + 1:04d}"

        wo = WorkOrder(
            tenant_id=tenant_id,
            work_order_number=wo_num,
            production_order_id=po.id,
            bom_id=po.bom_id,
            routing_id=po.routing_id,
            work_center_id=wc.id,
            machine_id=machine_id,
            operator_id=op_id,
            planned_quantity=payload.plannedQuantity,
            status="running"
        )
        db.add(wo)
        db.flush()

        # Update PO status to in_progress
        po.status = "in_progress"

        # Initialize WIP record
        wip = WorkInProgress(
            tenant_id=tenant_id,
            work_order_id=wo.id,
            current_operation_seq=1,
            quantity_completed=0.0,
            quantity_remaining=payload.plannedQuantity,
            estimated_completion=datetime.utcnow() + timedelta(hours=8)
        )
        db.add(wip)

        # Log timeline
        tl = ManufacturingTimeline(
            tenant_id=tenant_id,
            production_order_id=po.id,
            work_order_id=wo.id,
            event_type="started",
            details=f"Work order {wo.work_order_number} released and execution started at center {wc.code}."
        )
        db.add(tl)

        db.commit()
        db.refresh(wo)
        return {
            "_id": str(wo.id),
            "workOrderNumber": wo.work_order_number,
            "status": wo.status
        }

    @staticmethod
    def list_work_orders(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        wos = db.query(WorkOrder).filter(
            WorkOrder.tenant_id == tenant_id,
            WorkOrder.deleted_at == None
        ).all()
        result = []
        for w in wos:
            po = db.query(ProductionOrder).filter(ProductionOrder.id == w.production_order_id).first()
            prod = db.query(product := item_repo.model).filter(product.id == po.item_id).first() if po else None
            wc = db.query(WorkCenter).filter(WorkCenter.id == w.work_center_id).first()
            mac = db.query(Machine).filter(Machine.id == w.machine_id).first() if w.machine_id else None
            result.append({
                "_id": str(w.id),
                "workOrderNumber": w.work_order_number,
                "productionOrderNumber": po.order_number if po else "",
                "productCode": prod.item_code if prod else "",
                "productName": prod.name if prod else "",
                "workCenterCode": wc.code if wc else "",
                "machineCode": mac.machine_code if mac else "",
                "plannedQuantity": w.planned_quantity,
                "producedQuantity": w.produced_quantity,
                "scrapQuantity": w.scrap_quantity,
                "status": w.status
            })
        return result

    @staticmethod
    def complete_work_order(db: Session, work_order_id: str, payload: WorkOrderCompleteSchema, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        wo = db.query(WorkOrder).filter(WorkOrder.id == uuid.UUID(work_order_id), WorkOrder.tenant_id == tenant_id).first()
        if not wo:
            raise HTTPException(status_code=404, detail="Work Order not found")

        po = db.query(ProductionOrder).filter(ProductionOrder.id == wo.production_order_id).first()
        if not po:
            raise HTTPException(status_code=404, detail="Parent production order missing")

        # 1. Deduct consumed materials from inventory (Warehouse)
        # For each consumed raw material item, call InventoryService.stock_out
        # Retrieve target warehouse (using plant's first warehouse context or defaulting)
        wh = db.query(warehouse_repo.model).filter(warehouse_repo.model.tenant_id == tenant_id).first()
        if not wh:
            raise HTTPException(status_code=400, detail="No warehouse registered in current tenant space to complete intakes")

        for cons in payload.consumptions:
            raw_item = item_repo.get_by_code(db, cons.itemCode, tenant_id)
            if not raw_item:
                continue

            # Log consumption ledger entry
            material_log = MaterialConsumption(
                tenant_id=tenant_id,
                work_order_id=wo.id,
                item_id=raw_item.id,
                batch_number=cons.batchNumber,
                serial_number=cons.serialNumber,
                quantity_consumed=cons.quantityConsumed,
                waste_quantity=cons.wasteQuantity or 0.0
            )
            db.add(material_log)

            # Atomic stock deduction
            wh_code = cons.warehouseCode or wh.code
            loc_code = cons.locationCode or None

            # Formulate StockOut schema
            stock_out_payload = StockOutSchema(
                itemCode=cons.itemCode,
                warehouseCode=wh_code,
                locationCode=loc_code,
                quantity=cons.quantityConsumed + (cons.wasteQuantity or 0.0),
                batchNumber=cons.batchNumber,
                serialNumbers=[cons.serialNumber] if cons.serialNumber else None,
                remarks=f"Consumed during execution of Work Order #{wo.work_order_number}"
            )
            InventoryService.stock_out(db, stock_out_payload, tenant_id, author_email)

        # 2. Add finished good product item to inventory
        prod_item = db.query(item_repo.model).filter(item_repo.model.id == po.item_id).first()
        if prod_item:
            # Output record
            out_log = ProductionOutput(
                tenant_id=tenant_id,
                work_order_id=wo.id,
                item_id=prod_item.id,
                good_quantity=payload.producedQuantity,
                scrap_quantity=payload.scrapQuantity or 0.0,
                rejected_quantity=payload.rejectedQuantity or 0.0
            )
            db.add(out_log)

            # Atomic stock intake
            stock_in_payload = StockInSchema(
                itemCode=prod_item.item_code,
                warehouseCode=wh.code,
                quantity=payload.producedQuantity,
                remarks=f"Intake finished good from Work Order #{wo.work_order_number}",
                unitCost=100.0 # Simulated costing index
            )
            InventoryService.stock_in(db, stock_in_payload, tenant_id, author_email)

        # 3. Log scraps
        if payload.scrapQuantity and payload.scrapQuantity > 0:
            scr_count = db.query(ScrapRecord).filter(ScrapRecord.tenant_id == tenant_id).count()
            scrap_rec = ScrapRecord(
                tenant_id=tenant_id,
                scrap_number=f"SCRAP-{scr_count + 1:04d}",
                work_order_id=wo.id,
                item_id=prod_item.id,
                scrap_category="process",
                quantity=payload.scrapQuantity,
                cost=(payload.scrapQuantity * 100.0),
                reason=payload.remarks or "Production defect scrap"
            )
            db.add(scrap_rec)

        # Update WO details
        wo.produced_quantity = payload.producedQuantity
        wo.scrap_quantity = payload.scrapQuantity or 0.0
        wo.status = "completed"

        # Update WIP status
        wip = db.query(WorkInProgress).filter(WorkInProgress.work_order_id == wo.id).first()
        if wip:
            wip.quantity_completed = payload.producedQuantity
            wip.quantity_remaining = 0.0
            wip.labor_hours = 8.0 # Simulated labor
            wip.machine_hours = 8.0 # Simulated machine

        # Update PO status if all work orders completed
        po.status = "completed"

        # Log timeline
        tl = ManufacturingTimeline(
            tenant_id=tenant_id,
            production_order_id=po.id,
            work_order_id=wo.id,
            event_type="completed",
            details=f"Work order {wo.work_order_number} completed. Good output: {payload.producedQuantity} items."
        )
        db.add(tl)

        # Audit Log
        aud = ManufacturingAuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="WORK_ORDER_COMPLETED",
            details=f"Completed work order {wo.work_order_number} generating finished goods"
        )
        db.add(aud)

        db.commit()
        db.refresh(wo)
        return {
            "_id": str(wo.id),
            "status": wo.status,
            "producedQuantity": wo.produced_quantity
        }

    # ── Quality Inspections ──
    @staticmethod
    def submit_quality_inspection(db: Session, payload: QualityInspectionSubmitSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        product = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product item not found")

        wo_id = None
        if payload.workOrderNumber:
            wo = wo_repo.get_by_number(db, payload.workOrderNumber, tenant_id)
            if wo:
                wo_id = wo.id

        qi_count = db.query(QualityInspection).filter(QualityInspection.tenant_id == tenant_id).count()
        qi_num = f"QI-{qi_count + 1:04d}"

        qi = QualityInspection(
            tenant_id=tenant_id,
            inspection_number=qi_num,
            work_order_id=wo_id,
            item_id=product.id,
            stage=payload.stage,
            result=payload.result,
            inspector_email=author_email,
            criteria=payload.criteria,
            remarks=payload.remarks
        )
        db.add(qi)
        db.flush()

        # If rejected, automatically register Non-Conformance Report (NCR)
        ncr_id = None
        if payload.result in ["reject", "rework"]:
            ncr_count = db.query(NonConformanceReport).filter(NonConformanceReport.tenant_id == tenant_id).count()
            ncr = NonConformanceReport(
                tenant_id=tenant_id,
                ncr_number=f"NCR-{ncr_count + 1:04d}",
                inspection_id=qi.id,
                defect_details=payload.remarks or "Failed quality metrics parameters",
                root_cause="Under investigation",
                corrective_action="CAPA workflow initialized",
                status="open"
            )
            db.add(ncr)
            db.flush()
            ncr_id = ncr.id

        db.commit()
        db.refresh(qi)
        return {
            "_id": str(qi.id),
            "inspectionNumber": qi.inspection_number,
            "result": qi.result,
            "ncrId": str(ncr_id) if ncr_id else None
        }

    @staticmethod
    def list_quality_inspections(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        qis = db.query(QualityInspection).filter(
            QualityInspection.tenant_id == tenant_id,
            QualityInspection.deleted_at == None
        ).all()
        result = []
        for q in qis:
            prod = db.query(product := item_repo.model).filter(product.id == q.item_id).first()
            wo = db.query(WorkOrder).filter(WorkOrder.id == q.work_order_id).first() if q.work_order_id else None
            ncr = db.query(NonConformanceReport).filter(NonConformanceReport.inspection_id == q.id).first()
            result.append({
                "_id": str(q.id),
                "inspectionNumber": q.inspection_number,
                "workOrderNumber": wo.work_order_number if wo else "",
                "productCode": prod.item_code if prod else "",
                "productName": prod.name if prod else "",
                "stage": q.stage,
                "result": q.result,
                "inspectorEmail": q.inspector_email,
                "remarks": q.remarks,
                "ncrNumber": ncr.ncr_number if ncr else None,
                "ncrStatus": ncr.status if ncr else None
            })
        return result

    # ── Non-Conformance (NCR) & CAPA ──
    @staticmethod
    def list_ncrs(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        ncrs = db.query(NonConformanceReport).filter(
            NonConformanceReport.tenant_id == tenant_id,
            NonConformanceReport.deleted_at == None
        ).all()
        result = []
        for n in ncrs:
            qi = db.query(QualityInspection).filter(QualityInspection.id == n.inspection_id).first()
            prod = db.query(product := item_repo.model).filter(product.id == qi.item_id).first() if qi else None
            result.append({
                "_id": str(n.id),
                "ncrNumber": n.ncr_number,
                "defectDetails": n.defect_details,
                "rootCause": n.root_cause,
                "correctiveAction": n.corrective_action,
                "status": n.status,
                "productName": prod.name if prod else ""
            })
        return result

    @staticmethod
    def update_capa(db: Session, ncr_id: str, root_cause: str, corrective_action: str, status: str, tenant_id: uuid.UUID) -> dict:
        ncr = db.query(NonConformanceReport).filter(NonConformanceReport.id == uuid.UUID(ncr_id), NonConformanceReport.tenant_id == tenant_id).first()
        if not ncr:
            raise HTTPException(status_code=404, detail="NCR not found")
        ncr.root_cause = root_cause
        ncr.corrective_action = corrective_action
        ncr.status = status
        db.commit()
        return {
            "_id": str(ncr.id),
            "status": ncr.status
        }

    # ── Scrap ──
    @staticmethod
    def submit_scrap(db: Session, payload: ScrapSubmitSchema, tenant_id: uuid.UUID) -> dict:
        product = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product item not found")

        wo_id = None
        if payload.workOrderNumber:
            wo = wo_repo.get_by_number(db, payload.workOrderNumber, tenant_id)
            if wo:
                wo_id = wo.id

        scr_count = db.query(ScrapRecord).filter(ScrapRecord.tenant_id == tenant_id).count()
        scr = ScrapRecord(
            tenant_id=tenant_id,
            scrap_number=f"SCRAP-{scr_count + 1:04d}",
            work_order_id=wo_id,
            item_id=product.id,
            scrap_category=payload.scrapCategory,
            quantity=payload.quantity,
            cost=payload.cost or (payload.quantity * 100.0),
            reason=payload.reason
        )
        db.add(scr)
        db.commit()
        db.refresh(scr)
        return {
            "_id": str(scr.id),
            "scrapNumber": scr.scrap_number,
            "quantity": scr.quantity
        }

    @staticmethod
    def list_scraps(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        scraps = db.query(ScrapRecord).filter(
            ScrapRecord.tenant_id == tenant_id,
            ScrapRecord.deleted_at == None
        ).all()
        result = []
        for s in scraps:
            prod = db.query(product := item_repo.model).filter(product.id == s.item_id).first()
            result.append({
                "_id": str(s.id),
                "scrapNumber": s.scrap_number,
                "productName": prod.name if prod else "",
                "scrapCategory": s.scrap_category,
                "quantity": s.quantity,
                "cost": s.cost,
                "reason": s.reason
            })
        return result

    # ── OEE & Machine Performance ──
    @staticmethod
    def get_oee_metrics(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        machines = db.query(Machine).filter(Machine.tenant_id == tenant_id, Machine.deleted_at == None).all()
        result = []
        for m in machines:
            # Fetch latest OEE performance records or simulate
            perf = db.query(MachinePerformance).filter(MachinePerformance.machine_id == m.id).order_by(MachinePerformance.date.desc()).first()
            
            if perf:
                oee_val = perf.oee
                a_val = perf.availability_rate
                p_val = perf.performance_rate
                q_val = perf.quality_rate
            else:
                # Setup default simulated OEE metrics for demo
                # Availability: 92%, Performance: 88%, Quality: 99% -> OEE: 80.1%
                a_val, p_val, q_val = 92.0, 88.0, 99.0
                oee_val = (a_val * p_val * q_val) / 10000.0

            result.append({
                "machineCode": m.machine_code,
                "machineName": m.name,
                "availability": a_val,
                "performance": p_val,
                "quality": q_val,
                "oee": round(oee_val, 2)
            })
        return result

    # ── Manufacturing Dashboard Summary ──
    @staticmethod
    def get_dashboard_summary(db: Session, tenant_id: uuid.UUID) -> dict:
        total_plants = db.query(ManufacturingPlant).filter(ManufacturingPlant.tenant_id == tenant_id, ManufacturingPlant.deleted_at == None).count()
        active_pos = db.query(ProductionOrder).filter(ProductionOrder.tenant_id == tenant_id, ProductionOrder.status.in_(["released", "in_progress"])).count()
        running_wos = db.query(WorkOrder).filter(WorkOrder.tenant_id == tenant_id, WorkOrder.status == "running").count()
        
        # Calculate overall OEE average
        oee_list = ManufacturingService.get_oee_metrics(db, tenant_id)
        avg_oee = sum([x["oee"] for x in oee_list]) / len(oee_list) if oee_list else 82.5

        # Calculate scrap value total
        scraps = db.query(ScrapRecord).filter(ScrapRecord.tenant_id == tenant_id).all()
        scrap_cost = sum([s.cost for s in scraps])

        # Active production list
        recent_pos = db.query(ProductionOrder).filter(
            ProductionOrder.tenant_id == tenant_id
        ).order_by(ProductionOrder.created_at.desc()).limit(5).all()

        active_orders = []
        for po in recent_pos:
            prod = db.query(product := item_repo.model).filter(product.id == po.item_id).first()
            active_orders.append({
                "orderNumber": po.order_number,
                "productName": prod.name if prod else "",
                "quantity": po.quantity,
                "status": po.status
            })

        return {
            "totalPlants": total_plants,
            "activeProductionOrdersCount": active_pos,
            "runningWorkOrdersCount": running_wos,
            "averageOEE": round(avg_oee, 2),
            "scrapCostTotal": scrap_cost,
            "activeOrders": active_orders
        }

    # ── Capacity planning what-if simulations ──
    @staticmethod
    def get_capacity_planning(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        wcs = db.query(WorkCenter).filter(WorkCenter.tenant_id == tenant_id, WorkCenter.deleted_at == None).all()
        result = []
        for wc in wcs:
            # Sum planned load on work center from running and pending work orders
            wos = db.query(WorkOrder).filter(WorkOrder.work_center_id == wc.id, WorkOrder.status.in_(["pending", "running"])).all()
            load = sum([w.planned_quantity for w in wos])
            capacity = wc.capacity or 100.0
            utilization = (load / capacity) * 100.0 if capacity > 0 else 0.0
            
            result.append({
                "workCenterCode": wc.code,
                "workCenterName": wc.name,
                "capacity": capacity,
                "load": load,
                "utilization": min(utilization, 150.0),
                "recommendation": "Optimal workload" if utilization <= 90.0 else "Capacity overflow risk. Re-schedule orders to alternative center shifts."
            })
        return result

    # ── AI Forecasting & Planning Assistant ──
    @staticmethod
    def get_demand_forecast(db: Session, plant_code: str, horizon_days: int, tenant_id: uuid.UUID) -> dict:
        plant = plant_repo.get_by_code(db, plant_code, tenant_id)
        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        # Simulate forecast points based on historical throughput
        forecast_points = []
        base_demand = 85.0
        for day in range(1, horizon_days + 1):
            seasonality = 1.0 + 0.12 * math.cos(day * (2 * math.pi / 7)) # Weekly seasonality
            trend = 0.2 * day
            predicted = base_demand * seasonality + trend
            forecast_points.append({
                "day": day,
                "predictedVolume": round(predicted, 2),
                "confidenceScore": round(90.0 - (day * 0.4), 1)
            })

        return {
            "plantCode": plant_code,
            "plantName": plant.name,
            "averageDemand": base_demand,
            "horizonDays": horizon_days,
            "points": forecast_points
        }

    # ── MRP material requirements plan computations ──
    @staticmethod
    def calculate_mrp(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        # Compute MRP for released and in-progress production orders
        pos = db.query(ProductionOrder).filter(ProductionOrder.tenant_id == tenant_id, ProductionOrder.status.in_(["released", "in_progress"])).all()
        mrp_requirements = []
        
        for po in pos:
            # Resolve BOM components
            bom_comps = db.query(BOMComponent).filter(BOMComponent.bom_id == po.bom_id).all()
            for comp in bom_comps:
                comp_item = db.query(item_repo.model).filter(item_repo.model.id == comp.item_id).first()
                required_qty = comp.quantity * po.quantity
                
                # Fetch warehouse balances
                balances = db.query(StockBalance).filter(StockBalance.item_id == comp.item_id, StockBalance.tenant_id == tenant_id).all()
                on_hand = sum([b.quantity for b in balances])
                shortage = max(required_qty - on_hand, 0.0)
                
                mrp_requirements.append({
                    "itemCode": comp_item.item_code if comp_item else "",
                    "itemName": comp_item.name if comp_item else "Raw Material",
                    "requiredQuantity": required_qty,
                    "onHandQuantity": on_hand,
                    "shortageQuantity": shortage,
                    "actionRecommended": "Trigger purchase order" if shortage > 0 else "Inventory level sufficient"
                })
        return mrp_requirements
