from app.repositories.base import BaseRepository
from app.models.inventory import (
    InventoryCategory, InventoryItem, Warehouse, WarehouseLocation,
    StockBalance, StockMovement, StockBatch, StockSerial,
    WarehouseTask, InventoryCount, InventoryCountItem,
    InventoryAdjustment, InventoryValuation, ReorderRecommendation,
    InventoryForecast, InventoryTimeline
)
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class InventoryCategoryRepository(BaseRepository[InventoryCategory]):
    def __init__(self):
        super().__init__(InventoryCategory)
        
    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[InventoryCategory]:
        return db.query(InventoryCategory).filter(
            InventoryCategory.code == code,
            InventoryCategory.tenant_id == tenant_id,
            InventoryCategory.deleted_at == None
        ).first()

class InventoryItemRepository(BaseRepository[InventoryItem]):
    def __init__(self):
        super().__init__(InventoryItem)
        
    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[InventoryItem]:
        return db.query(InventoryItem).filter(
            InventoryItem.item_code == code,
            InventoryItem.tenant_id == tenant_id,
            InventoryItem.deleted_at == None
        ).first()

    def get_by_sku(self, db: Session, sku: str, tenant_id: UUID) -> Optional[InventoryItem]:
        return db.query(InventoryItem).filter(
            InventoryItem.sku == sku,
            InventoryItem.tenant_id == tenant_id,
            InventoryItem.deleted_at == None
        ).first()

class WarehouseRepository(BaseRepository[Warehouse]):
    def __init__(self):
        super().__init__(Warehouse)
        
    def get_by_code(self, db: Session, code: str, tenant_id: UUID) -> Optional[Warehouse]:
        return db.query(Warehouse).filter(
            Warehouse.code == code,
            Warehouse.tenant_id == tenant_id,
            Warehouse.deleted_at == None
        ).first()

class WarehouseLocationRepository(BaseRepository[WarehouseLocation]):
    def __init__(self):
        super().__init__(WarehouseLocation)
        
    def get_by_code(self, db: Session, warehouse_id: UUID, code: str, tenant_id: UUID) -> Optional[WarehouseLocation]:
        return db.query(WarehouseLocation).filter(
            WarehouseLocation.warehouse_id == warehouse_id,
            WarehouseLocation.code == code,
            WarehouseLocation.tenant_id == tenant_id,
            WarehouseLocation.deleted_at == None
        ).first()

class StockBalanceRepository(BaseRepository[StockBalance]):
    def __init__(self):
        super().__init__(StockBalance)
        
    def get_balance(self, db: Session, item_id: UUID, warehouse_id: UUID, location_id: Optional[UUID], tenant_id: UUID) -> Optional[StockBalance]:
        query = db.query(StockBalance).filter(
            StockBalance.item_id == item_id,
            StockBalance.warehouse_id == warehouse_id,
            StockBalance.tenant_id == tenant_id,
            StockBalance.deleted_at == None
        )
        if location_id:
            query = query.filter(StockBalance.location_id == location_id)
        else:
            query = query.filter(StockBalance.location_id == None)
        return query.first()

class StockBatchRepository(BaseRepository[StockBatch]):
    def __init__(self):
        super().__init__(StockBatch)
        
    def get_batch(self, db: Session, item_id: UUID, batch_number: str, tenant_id: UUID) -> Optional[StockBatch]:
        return db.query(StockBatch).filter(
            StockBatch.item_id == item_id,
            StockBatch.batch_number == batch_number,
            StockBatch.tenant_id == tenant_id,
            StockBatch.deleted_at == None
        ).first()

class StockSerialRepository(BaseRepository[StockSerial]):
    def __init__(self):
        super().__init__(StockSerial)
        
    def get_serial(self, db: Session, item_id: UUID, serial_number: str, tenant_id: UUID) -> Optional[StockSerial]:
        return db.query(StockSerial).filter(
            StockSerial.item_id == item_id,
            StockSerial.serial_number == serial_number,
            StockSerial.tenant_id == tenant_id,
            StockSerial.deleted_at == None
        ).first()

class StockMovementRepository(BaseRepository[StockMovement]):
    def __init__(self):
        super().__init__(StockMovement)

class WarehouseTaskRepository(BaseRepository[WarehouseTask]):
    def __init__(self):
        super().__init__(WarehouseTask)
