from app.repositories.base import BaseRepository
from app.models.manufacturing import (
    ManufacturingPlant, ProductionCalendar, BillOfMaterials, BOMComponent,
    RoutingMaster, RoutingOperation, WorkCenter, Machine,
    ProductionOrder, WorkOrder, MaterialConsumption, WorkInProgress,
    ProductionOutput, QualityInspection, NonConformanceReport, ScrapRecord,
    MachinePerformance, ProductionAnalytics, ManufacturingTimeline, ManufacturingAuditLog
)
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class ManufacturingPlantRepository(BaseRepository[ManufacturingPlant]):
    def __init__(self):
        super().__init__(ManufacturingPlant)

    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[ManufacturingPlant]:
        return db.query(ManufacturingPlant).filter(
            ManufacturingPlant.code == code,
            ManufacturingPlant.tenant_id == tenant_id,
            ManufacturingPlant.deleted_at == None
        ).first()

class ProductionCalendarRepository(BaseRepository[ProductionCalendar]):
    def __init__(self):
        super().__init__(ProductionCalendar)

class BillOfMaterialsRepository(BaseRepository[BillOfMaterials]):
    def __init__(self):
        super().__init__(BillOfMaterials)

    def get_by_number(self, db: Session, bom_number: str, tenant_id: UUID) -> Optional[BillOfMaterials]:
        return db.query(BillOfMaterials).filter(
            BillOfMaterials.bom_number == bom_number,
            BillOfMaterials.tenant_id == tenant_id,
            BillOfMaterials.deleted_at == None
        ).first()

class BOMComponentRepository(BaseRepository[BOMComponent]):
    def __init__(self):
        super().__init__(BOMComponent)

class RoutingMasterRepository(BaseRepository[RoutingMaster]):
    def __init__(self):
        super().__init__(RoutingMaster)

    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[RoutingMaster]:
        return db.query(RoutingMaster).filter(
            RoutingMaster.code == code,
            RoutingMaster.tenant_id == tenant_id,
            RoutingMaster.deleted_at == None
        ).first()

class RoutingOperationRepository(BaseRepository[RoutingOperation]):
    def __init__(self):
        super().__init__(RoutingOperation)

class WorkCenterRepository(BaseRepository[WorkCenter]):
    def __init__(self):
        super().__init__(WorkCenter)

    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[WorkCenter]:
        return db.query(WorkCenter).filter(
            WorkCenter.code == code,
            WorkCenter.tenant_id == tenant_id,
            WorkCenter.deleted_at == None
        ).first()

class MachineRepository(BaseRepository[Machine]):
    def __init__(self):
        super().__init__(Machine)

    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[Machine]:
        return db.query(Machine).filter(
            Machine.machine_code == code,
            Machine.tenant_id == tenant_id,
            Machine.deleted_at == None
        ).first()

class ProductionOrderRepository(BaseRepository[ProductionOrder]):
    def __init__(self):
        super().__init__(ProductionOrder)

    def get_by_number(self, db: Session, order_number: str, tenant_id: UUID) -> Optional[ProductionOrder]:
        return db.query(ProductionOrder).filter(
            ProductionOrder.order_number == order_number,
            ProductionOrder.tenant_id == tenant_id,
            ProductionOrder.deleted_at == None
        ).first()

class WorkOrderRepository(BaseRepository[WorkOrder]):
    def __init__(self):
        super().__init__(WorkOrder)

    def get_by_number(self, db: Session, number: str, tenant_id: UUID) -> Optional[WorkOrder]:
        return db.query(WorkOrder).filter(
            WorkOrder.work_order_number == number,
            WorkOrder.tenant_id == tenant_id,
            WorkOrder.deleted_at == None
        ).first()

class MaterialConsumptionRepository(BaseRepository[MaterialConsumption]):
    def __init__(self):
        super().__init__(MaterialConsumption)

class WorkInProgressRepository(BaseRepository[WorkInProgress]):
    def __init__(self):
        super().__init__(WorkInProgress)

class ProductionOutputRepository(BaseRepository[ProductionOutput]):
    def __init__(self):
        super().__init__(ProductionOutput)

class QualityInspectionRepository(BaseRepository[QualityInspection]):
    def __init__(self):
        super().__init__(QualityInspection)

    def get_by_number(self, db: Session, number: str, tenant_id: UUID) -> Optional[QualityInspection]:
        return db.query(QualityInspection).filter(
            QualityInspection.inspection_number == number,
            QualityInspection.tenant_id == tenant_id,
            QualityInspection.deleted_at == None
        ).first()

class NonConformanceReportRepository(BaseRepository[NonConformanceReport]):
    def __init__(self):
        super().__init__(NonConformanceReport)

class ScrapRecordRepository(BaseRepository[ScrapRecord]):
    def __init__(self):
        super().__init__(ScrapRecord)

class MachinePerformanceRepository(BaseRepository[MachinePerformance]):
    def __init__(self):
        super().__init__(MachinePerformance)

class ProductionAnalyticsRepository(BaseRepository[ProductionAnalytics]):
    def __init__(self):
        super().__init__(ProductionAnalytics)

class ManufacturingTimelineRepository(BaseRepository[ManufacturingTimeline]):
    def __init__(self):
        super().__init__(ManufacturingTimeline)

class ManufacturingAuditLogRepository(BaseRepository[ManufacturingAuditLog]):
    def __init__(self):
        super().__init__(ManufacturingAuditLog)
