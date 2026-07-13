from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.models.maintenance import (
    MaintenanceAsset, EquipmentMaster, AssetHierarchy, MaintenancePlan,
    MaintenanceCalendar, MaintenanceRequest, MaintenanceWorkOrder,
    TechnicianAssignment, MaintenanceInspection, InspectionChecklist,
    SparePartsConsumption, MaintenanceHistory, AssetHealth, PredictiveAlert,
    MaintenanceCost, ReliabilityMetric, MaintenanceAnalytics,
    MaintenanceTimeline, MaintenanceAuditLog
)

class MaintenanceAssetRepository:
    def get(self, db: Session, asset_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[MaintenanceAsset]:
        return db.query(MaintenanceAsset).filter(
            MaintenanceAsset.id == asset_id,
            MaintenanceAsset.tenant_id == tenant_id,
            MaintenanceAsset.deleted_at == None
        ).first()

    def get_by_code(self, db: Session, asset_code: str, tenant_id: uuid.UUID) -> Optional[MaintenanceAsset]:
        return db.query(MaintenanceAsset).filter(
            MaintenanceAsset.asset_code == asset_code,
            MaintenanceAsset.tenant_id == tenant_id,
            MaintenanceAsset.deleted_at == None
        ).first()

class EquipmentMasterRepository:
    def get_by_code(self, db: Session, code: str, tenant_id: uuid.UUID) -> Optional[EquipmentMaster]:
        return db.query(EquipmentMaster).filter(
            EquipmentMaster.code == code,
            EquipmentMaster.tenant_id == tenant_id,
            EquipmentMaster.deleted_at == None
        ).first()

class AssetHierarchyRepository:
    def get_hierarchy_for_asset(self, db: Session, asset_id: uuid.UUID, tenant_id: uuid.UUID) -> List[AssetHierarchy]:
        return db.query(AssetHierarchy).filter(
            AssetHierarchy.parent_asset_id == asset_id,
            AssetHierarchy.tenant_id == tenant_id,
            AssetHierarchy.deleted_at == None
        ).all()

class MaintenancePlanRepository:
    def get_by_number(self, db: Session, plan_number: str, tenant_id: uuid.UUID) -> Optional[MaintenancePlan]:
        return db.query(MaintenancePlan).filter(
            MaintenancePlan.plan_number == plan_number,
            MaintenancePlan.tenant_id == tenant_id,
            MaintenancePlan.deleted_at == None
        ).first()

class MaintenanceCalendarRepository:
    def get_calendar_for_asset(self, db: Session, asset_id: uuid.UUID, tenant_id: uuid.UUID) -> List[MaintenanceCalendar]:
        return db.query(MaintenanceCalendar).filter(
            MaintenanceCalendar.asset_id == asset_id,
            MaintenanceCalendar.tenant_id == tenant_id,
            MaintenanceCalendar.deleted_at == None
        ).all()

class MaintenanceRequestRepository:
    def get_by_number(self, db: Session, request_number: str, tenant_id: uuid.UUID) -> Optional[MaintenanceRequest]:
        return db.query(MaintenanceRequest).filter(
            MaintenanceRequest.request_number == request_number,
            MaintenanceRequest.tenant_id == tenant_id,
            MaintenanceRequest.deleted_at == None
        ).first()

class MaintenanceWorkOrderRepository:
    def get_by_number(self, db: Session, wo_number: str, tenant_id: uuid.UUID) -> Optional[MaintenanceWorkOrder]:
        return db.query(MaintenanceWorkOrder).filter(
            MaintenanceWorkOrder.work_order_number == wo_number,
            MaintenanceWorkOrder.tenant_id == tenant_id,
            MaintenanceWorkOrder.deleted_at == None
        ).first()

class TechnicianAssignmentRepository:
    def get_technician_skills(self, db: Session, tech_id: uuid.UUID, tenant_id: uuid.UUID) -> List[TechnicianAssignment]:
        return db.query(TechnicianAssignment).filter(
            TechnicianAssignment.technician_id == tech_id,
            TechnicianAssignment.tenant_id == tenant_id,
            TechnicianAssignment.deleted_at == None
        ).all()

class MaintenanceInspectionRepository:
    def get_by_number(self, db: Session, inspection_number: str, tenant_id: uuid.UUID) -> Optional[MaintenanceInspection]:
        return db.query(MaintenanceInspection).filter(
            MaintenanceInspection.inspection_number == inspection_number,
            MaintenanceInspection.tenant_id == tenant_id,
            MaintenanceInspection.deleted_at == None
        ).first()

class InspectionChecklistRepository:
    pass

class SparePartsConsumptionRepository:
    pass

class MaintenanceHistoryRepository:
    def get_by_asset(self, db: Session, asset_id: uuid.UUID, tenant_id: uuid.UUID) -> List[MaintenanceHistory]:
        return db.query(MaintenanceHistory).filter(
            MaintenanceHistory.asset_id == asset_id,
            MaintenanceHistory.tenant_id == tenant_id,
            MaintenanceHistory.deleted_at == None
        ).order_by(MaintenanceHistory.event_date.desc()).all()

class AssetHealthRepository:
    def get_latest_health(self, db: Session, asset_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[AssetHealth]:
        return db.query(AssetHealth).filter(
            AssetHealth.asset_id == asset_id,
            AssetHealth.tenant_id == tenant_id,
            AssetHealth.deleted_at == None
        ).order_by(AssetHealth.date.desc()).first()

class PredictiveAlertRepository:
    def get_active_alerts(self, db: Session, tenant_id: uuid.UUID) -> List[PredictiveAlert]:
        return db.query(PredictiveAlert).filter(
            PredictiveAlert.status == "active",
            PredictiveAlert.tenant_id == tenant_id,
            PredictiveAlert.deleted_at == None
        ).all()

class MaintenanceCostRepository:
    def aggregate_by_asset(self, db: Session, asset_id: uuid.UUID, tenant_id: uuid.UUID) -> float:
        # Sum cost records from history for simplicity or maintenance_costs tables
        costs = db.query(MaintenanceHistory).filter(
            MaintenanceHistory.asset_id == asset_id,
            MaintenanceHistory.tenant_id == tenant_id
        ).all()
        return sum([c.cost for c in costs])

class ReliabilityMetricRepository:
    pass

class MaintenanceAnalyticsRepository:
    pass

class MaintenanceTimelineRepository:
    pass

class MaintenanceAuditLogRepository:
    pass
