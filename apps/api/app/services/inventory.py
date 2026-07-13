from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
import math
from typing import Optional, Dict, Any, List

from app.repositories.inventory import (
    InventoryCategoryRepository, InventoryItemRepository, WarehouseRepository,
    WarehouseLocationRepository, StockBalanceRepository, StockBatchRepository,
    StockSerialRepository, StockMovementRepository, WarehouseTaskRepository
)
from app.models.inventory import (
    InventoryCategory, InventoryItem, Warehouse, WarehouseLocation,
    StockBalance, StockMovement, StockBatch, StockSerial,
    WarehouseTask, InventoryCount, InventoryCountItem,
    InventoryAdjustment, InventoryValuation, ReorderRecommendation,
    InventoryForecast, InventoryTimeline
)
from app.models.audit import AuditLog
from app.schemas.inventory import (
    CategoryCreateSchema, InventoryItemCreateSchema, WarehouseCreateSchema,
    LocationCreateSchema, StockInSchema, StockOutSchema, StockTransferSchema,
    AdjustmentCreateSchema, CycleCountSubmitSchema, PredictionRequestSchema
)

category_repo = InventoryCategoryRepository()
item_repo = InventoryItemRepository()
warehouse_repo = WarehouseRepository()
location_repo = WarehouseLocationRepository()
balance_repo = StockBalanceRepository()
batch_repo = StockBatchRepository()
serial_repo = StockSerialRepository()
movement_repo = StockMovementRepository()
task_repo = WarehouseTaskRepository()

def serialize_category(cat: InventoryCategory) -> dict:
    return {
        "_id": str(cat.id),
        "code": cat.code,
        "name": cat.name,
        "description": cat.description,
        "isActive": cat.is_active,
        "companyId": str(cat.tenant_id)
    }

def serialize_item(item: InventoryItem, db: Session) -> dict:
    cat = db.query(InventoryCategory).filter(InventoryCategory.id == item.category_id).first() if item.category_id else None
    wh = db.query(Warehouse).filter(Warehouse.id == item.default_warehouse_id).first() if item.default_warehouse_id else None
    
    return {
        "_id": str(item.id),
        "itemCode": item.item_code,
        "sku": item.sku,
        "name": item.name,
        "brand": item.brand,
        "manufacturer": item.manufacturer,
        "description": item.description,
        "categoryId": str(item.category_id) if item.category_id else None,
        "categoryName": cat.name if cat else None,
        "uom": item.uom,
        "taxCategory": item.tax_category,
        "barcode": item.barcode,
        "qrCode": item.qr_code,
        "status": item.status,
        "minStock": item.min_stock,
        "maxStock": item.max_stock,
        "safetyStock": item.safety_stock,
        "reorderPoint": item.reorder_point,
        "preferredVendor": item.preferred_vendor,
        "defaultWarehouseId": str(item.default_warehouse_id) if item.default_warehouse_id else None,
        "defaultWarehouseName": wh.name if wh else None,
        "companyId": str(item.tenant_id)
    }

def serialize_warehouse(wh: Warehouse) -> dict:
    return {
        "_id": str(wh.id),
        "code": wh.code,
        "name": wh.name,
        "address": wh.address,
        "managerId": str(wh.manager_id) if wh.manager_id else None,
        "capacity": wh.capacity,
        "type": wh.type,
        "status": wh.status,
        "currency": wh.currency,
        "companyId": str(wh.tenant_id)
    }

def serialize_location(loc: WarehouseLocation, db: Session) -> dict:
    wh = db.query(Warehouse).filter(Warehouse.id == loc.warehouse_id).first()
    return {
        "_id": str(loc.id),
        "warehouseId": str(loc.warehouse_id),
        "warehouseCode": wh.code if wh else "",
        "code": loc.code,
        "zone": loc.zone,
        "aisle": loc.aisle,
        "rack": loc.rack,
        "shelf": loc.shelf,
        "bin": loc.bin,
        "status": loc.status,
        "companyId": str(loc.tenant_id)
    }

def serialize_balance(bal: StockBalance, db: Session) -> dict:
    item = db.query(InventoryItem).filter(InventoryItem.id == bal.item_id).first()
    wh = db.query(Warehouse).filter(Warehouse.id == bal.warehouse_id).first()
    loc = db.query(WarehouseLocation).filter(WarehouseLocation.id == bal.location_id).first() if bal.location_id else None
    
    return {
        "_id": str(bal.id),
        "itemId": str(bal.item_id),
        "itemCode": item.item_code if item else "",
        "itemName": item.name if item else "",
        "warehouseId": str(bal.warehouse_id),
        "warehouseCode": wh.code if wh else "",
        "locationId": str(bal.location_id) if bal.location_id else None,
        "locationCode": loc.code if loc else None,
        "quantity": bal.quantity,
        "reservedQuantity": bal.reserved_quantity,
        "companyId": str(bal.tenant_id)
    }

class InventoryService:
    # ── Category & Item Master ────────────────────────────────────────────────
    @staticmethod
    def create_category(db: Session, payload: CategoryCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = category_repo.get_by_code(db, payload.code, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Category code already exists")
        cat = InventoryCategory(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
            is_active=payload.isActive if payload.isActive is not None else True
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return serialize_category(cat)

    @staticmethod
    def list_categories(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        cats = db.query(InventoryCategory).filter(
            InventoryCategory.tenant_id == tenant_id,
            InventoryCategory.deleted_at == None
        ).all()
        return [serialize_category(c) for c in cats]

    @staticmethod
    def create_item(db: Session, payload: InventoryItemCreateSchema, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        # Check unique constraints
        # Auto-generate Item Code
        count = db.query(InventoryItem).filter(InventoryItem.tenant_id == tenant_id).count()
        item_code = f"ITEM-{count + 1:04d}"
        
        # Auto-generate SKU if not provided
        sku = payload.sku
        if not sku:
            # Format: BRAND-CAT-NAME-RANDOM
            brand_part = (payload.brand or "GEN")[:3].upper()
            cat_part = (payload.categoryCode or "CAT")[:3].upper()
            name_part = payload.name[:3].upper()
            sku = f"{brand_part}-{cat_part}-{name_part}-{count+1:03d}"
            
        # Resolve category
        category_id = None
        if payload.categoryCode:
            cat = category_repo.get_by_code(db, payload.categoryCode, tenant_id)
            if cat:
                category_id = cat.id
                
        # Resolve default warehouse
        default_wh_id = None
        if payload.defaultWarehouseCode:
            wh = warehouse_repo.get_by_code(db, payload.defaultWarehouseCode, tenant_id)
            if wh:
                default_wh_id = wh.id

        item = InventoryItem(
            tenant_id=tenant_id,
            item_code=item_code,
            sku=sku,
            name=payload.name,
            brand=payload.brand,
            manufacturer=payload.manufacturer,
            description=payload.description,
            category_id=category_id,
            uom=payload.uom or "piece",
            tax_category=payload.taxCategory,
            barcode=payload.barcode or item_code,
            qr_code=payload.qrCode or item_code,
            status="active",
            min_stock=payload.minStock or 0.0,
            max_stock=payload.maxStock or 0.0,
            safety_stock=payload.safetyStock or 0.0,
            reorder_point=payload.reorderPoint or 0.0,
            preferred_vendor=payload.preferredVendor,
            default_warehouse_id=default_wh_id
        )
        db.add(item)
        db.flush()
        
        # Add to timeline
        timeline = InventoryTimeline(
            tenant_id=tenant_id,
            item_id=item.id,
            event_type="created",
            details=f"Item Master initialized with SKU {sku} by {author_email}"
        )
        db.add(timeline)
        
        # Add Audit log
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="ITEM_CREATED",
            details=f"Created item code {item_code} with SKU {sku}"
        )
        db.add(audit)
        
        db.commit()
        db.refresh(item)
        return serialize_item(item, db)

    @staticmethod
    def list_items(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        items = db.query(InventoryItem).filter(
            InventoryItem.tenant_id == tenant_id,
            InventoryItem.deleted_at == None
        ).order_by(InventoryItem.created_at.desc()).all()
        return [serialize_item(i, db) for i in items]

    # ── Warehouses & Locations ────────────────────────────────────────────────
    @staticmethod
    def create_warehouse(db: Session, payload: WarehouseCreateSchema, tenant_id: uuid.UUID) -> dict:
        existing = warehouse_repo.get_by_code(db, payload.code, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Warehouse code already exists")
            
        mgr_id = None
        if payload.managerId:
            try:
                mgr_id = uuid.UUID(payload.managerId)
            except ValueError:
                pass
                
        wh = Warehouse(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            address=payload.address,
            manager_id=mgr_id,
            capacity=payload.capacity,
            type=payload.type or "distribution",
            status=payload.status or "active",
            currency=payload.currency or "INR"
        )
        db.add(wh)
        db.commit()
        db.refresh(wh)
        return serialize_warehouse(wh)

    @staticmethod
    def list_warehouses(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        whs = db.query(Warehouse).filter(
            Warehouse.tenant_id == tenant_id,
            Warehouse.deleted_at == None
        ).all()
        return [serialize_warehouse(w) for w in whs]

    @staticmethod
    def create_location(db: Session, payload: LocationCreateSchema, tenant_id: uuid.UUID) -> dict:
        wh = warehouse_repo.get_by_code(db, payload.warehouseCode, tenant_id)
        if not wh:
            raise HTTPException(status_code=404, detail="Warehouse not found")
            
        existing = location_repo.get_by_code(db, wh.id, payload.code, tenant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Location code already exists in this warehouse")
            
        loc = WarehouseLocation(
            tenant_id=tenant_id,
            warehouse_id=wh.id,
            code=payload.code,
            zone=payload.zone,
            aisle=payload.aisle,
            rack=payload.rack,
            shelf=payload.shelf,
            bin=payload.bin,
            status="active"
        )
        db.add(loc)
        db.commit()
        db.refresh(loc)
        return serialize_location(loc, db)

    @staticmethod
    def list_locations(db: Session, warehouse_code: Optional[str], tenant_id: uuid.UUID) -> List[dict]:
        query = db.query(WarehouseLocation).filter(
            WarehouseLocation.tenant_id == tenant_id,
            WarehouseLocation.deleted_at == None
        )
        if warehouse_code:
            wh = warehouse_repo.get_by_code(db, warehouse_code, tenant_id)
            if wh:
                query = query.filter(WarehouseLocation.warehouse_id == wh.id)
                
        locs = query.all()
        return [serialize_location(l, db) for l in locs]

    # ── Stock Core Transactions ───────────────────────────────────────────────
    @staticmethod
    def stock_in(db: Session, payload: StockInSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        item = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
            
        wh = warehouse_repo.get_by_code(db, payload.warehouseCode, tenant_id)
        if not wh:
            raise HTTPException(status_code=404, detail="Warehouse not found")
            
        location_id = None
        if payload.locationCode:
            loc = location_repo.get_by_code(db, wh.id, payload.locationCode, tenant_id)
            if not loc:
                raise HTTPException(status_code=404, detail="Warehouse location not found")
            location_id = loc.id

        # Update StockBalance
        bal = balance_repo.get_balance(db, item.id, wh.id, location_id, tenant_id)
        if not bal:
            bal = StockBalance(
                tenant_id=tenant_id,
                item_id=item.id,
                warehouse_id=wh.id,
                location_id=location_id,
                quantity=0.0,
                reserved_quantity=0.0
            )
            db.add(bal)
        bal.quantity += payload.quantity

        # Create StockMovement
        mvt = StockMovement(
            tenant_id=tenant_id,
            item_id=item.id,
            warehouse_id=wh.id,
            location_id=location_id,
            type="stock_in",
            quantity=payload.quantity,
            unit_cost=payload.unitCost,
            reference_type=payload.referenceType or "manual",
            reference_id=payload.referenceId,
            remarks=payload.remarks
        )
        db.add(mvt)

        # Handle Batch Tracking
        if payload.batchNumber:
            expiry = None
            if payload.expiryDate:
                expiry = datetime.strptime(payload.expiryDate, "%Y-%m-%d")
                
            batch = batch_repo.get_batch(db, item.id, payload.batchNumber, tenant_id)
            if not batch:
                batch = StockBatch(
                    tenant_id=tenant_id,
                    item_id=item.id,
                    batch_number=payload.batchNumber,
                    manufacturing_date=datetime.utcnow(),
                    expiry_date=expiry,
                    quantity=0.0,
                    status="approved"
                )
                db.add(batch)
            batch.quantity += payload.quantity

        # Handle Serial Number Tracking
        if payload.serialNumbers:
            for s_num in payload.serialNumbers:
                existing_serial = serial_repo.get_serial(db, item.id, s_num, tenant_id)
                if existing_serial:
                    raise HTTPException(status_code=400, detail=f"Serial number {s_num} already exists for this item")
                serial = StockSerial(
                    tenant_id=tenant_id,
                    item_id=item.id,
                    serial_number=s_num,
                    purchase_date=datetime.utcnow(),
                    status="available",
                    current_location_id=location_id
                )
                db.add(serial)

        # Add to Timeline
        timeline = InventoryTimeline(
            tenant_id=tenant_id,
            item_id=item.id,
            event_type="stock_in",
            details=f"Received +{payload.quantity} {item.uom}(s) in warehouse {wh.code} (cost: {payload.unitCost})"
        )
        db.add(timeline)

        db.commit()
        db.refresh(bal)
        return serialize_balance(bal, db)

    @staticmethod
    def stock_out(db: Session, payload: StockOutSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        item = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
            
        wh = warehouse_repo.get_by_code(db, payload.warehouseCode, tenant_id)
        if not wh:
            raise HTTPException(status_code=404, detail="Warehouse not found")
            
        location_id = None
        if payload.locationCode:
            loc = location_repo.get_by_code(db, wh.id, payload.locationCode, tenant_id)
            if not loc:
                raise HTTPException(status_code=404, detail="Warehouse location not found")
            location_id = loc.id

        bal = balance_repo.get_balance(db, item.id, wh.id, location_id, tenant_id)
        if not bal or bal.quantity < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock quantity available")

        # Deduct stock
        bal.quantity -= payload.quantity

        # Create StockMovement
        # Try to resolve cost from FIFO logic for reporting
        fifo_valuation = InventoryService.calculate_fifo_cost(db, item.id, payload.quantity, tenant_id)
        unit_cost = fifo_valuation["averageUnitCost"]

        mvt = StockMovement(
            tenant_id=tenant_id,
            item_id=item.id,
            warehouse_id=wh.id,
            location_id=location_id,
            type="stock_out",
            quantity=-payload.quantity,
            unit_cost=unit_cost,
            reference_type=payload.referenceType or "manual",
            reference_id=payload.referenceId,
            remarks=payload.remarks
        )
        db.add(mvt)

        # Batch decrement
        if payload.batchNumber:
            batch = batch_repo.get_batch(db, item.id, payload.batchNumber, tenant_id)
            if batch:
                if batch.quantity < payload.quantity:
                    raise HTTPException(status_code=400, detail="Insufficient stock in the specified batch")
                batch.quantity -= payload.quantity

        # Serial status update
        if payload.serialNumbers:
            for s_num in payload.serialNumbers:
                serial = serial_repo.get_serial(db, item.id, s_num, tenant_id)
                if serial:
                    serial.status = "assigned"

        # Timeline log
        timeline = InventoryTimeline(
            tenant_id=tenant_id,
            item_id=item.id,
            event_type="stock_out",
            details=f"Issued -{payload.quantity} {item.uom}(s) from warehouse {wh.code}"
        )
        db.add(timeline)

        db.commit()
        db.refresh(bal)
        return serialize_balance(bal, db)

    @staticmethod
    def transfer(db: Session, payload: StockTransferSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        item = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
            
        from_wh = warehouse_repo.get_by_code(db, payload.fromWarehouseCode, tenant_id)
        to_wh = warehouse_repo.get_by_code(db, payload.toWarehouseCode, tenant_id)
        if not from_wh or not to_wh:
            raise HTTPException(status_code=404, detail="Source or destination warehouse not found")
            
        from_loc_id = None
        if payload.fromLocationCode:
            loc = location_repo.get_by_code(db, from_wh.id, payload.fromLocationCode, tenant_id)
            if not loc:
                raise HTTPException(status_code=404, detail="Source location not found")
            from_loc_id = loc.id

        to_loc_id = None
        if payload.toLocationCode:
            loc = location_repo.get_by_code(db, to_wh.id, payload.toLocationCode, tenant_id)
            if not loc:
                raise HTTPException(status_code=404, detail="Destination location not found")
            to_loc_id = loc.id

        # Deduct from source
        from_bal = balance_repo.get_balance(db, item.id, from_wh.id, from_loc_id, tenant_id)
        if not from_bal or from_bal.quantity < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock at source warehouse")

        from_bal.quantity -= payload.quantity

        # Add to destination
        to_bal = balance_repo.get_balance(db, item.id, to_wh.id, to_loc_id, tenant_id)
        if not to_bal:
            to_bal = StockBalance(
                tenant_id=tenant_id,
                item_id=item.id,
                warehouse_id=to_wh.id,
                location_id=to_loc_id,
                quantity=0.0,
                reserved_quantity=0.0
            )
            db.add(to_bal)
        to_bal.quantity += payload.quantity

        # Movements log (transfer_out and transfer_in)
        # FIFO cost lookup
        val_cost = InventoryService.calculate_fifo_cost(db, item.id, payload.quantity, tenant_id)["averageUnitCost"]

        mvt_out = StockMovement(
            tenant_id=tenant_id,
            item_id=item.id,
            warehouse_id=from_wh.id,
            location_id=from_loc_id,
            type="transfer_out",
            quantity=-payload.quantity,
            unit_cost=val_cost,
            remarks=payload.remarks or f"Transfer to {to_wh.code}"
        )
        db.add(mvt_out)

        mvt_in = StockMovement(
            tenant_id=tenant_id,
            item_id=item.id,
            warehouse_id=to_wh.id,
            location_id=to_loc_id,
            type="transfer_in",
            quantity=payload.quantity,
            unit_cost=val_cost,
            remarks=payload.remarks or f"Transfer from {from_wh.code}"
        )
        db.add(mvt_in)

        # Update Serial Location
        if payload.serialNumbers:
            for s_num in payload.serialNumbers:
                serial = serial_repo.get_serial(db, item.id, s_num, tenant_id)
                if serial:
                    serial.current_location_id = to_loc_id

        # Timeline Log
        timeline = InventoryTimeline(
            tenant_id=tenant_id,
            item_id=item.id,
            event_type="transfer",
            details=f"Transferred {payload.quantity} {item.uom}(s) from {from_wh.code} to {to_wh.code}"
        )
        db.add(timeline)

        db.commit()
        db.refresh(to_bal)
        return serialize_balance(to_bal, db)

    # ── Stock Adjustments & Approvals ─────────────────────────────────────────
    @staticmethod
    def create_adjustment(db: Session, payload: AdjustmentCreateSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        item = item_repo.get_by_code(db, payload.itemCode, tenant_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
            
        wh = warehouse_repo.get_by_code(db, payload.warehouseCode, tenant_id)
        if not wh:
            raise HTTPException(status_code=404, detail="Warehouse not found")
            
        loc_id = None
        if payload.locationCode:
            loc = location_repo.get_by_code(db, wh.id, payload.locationCode, tenant_id)
            if not loc:
                raise HTTPException(status_code=404, detail="Location not found")
            loc_id = loc.id

        adj = InventoryAdjustment(
            tenant_id=tenant_id,
            item_id=item.id,
            warehouse_id=wh.id,
            location_id=loc_id,
            quantity_adjusted=payload.quantityAdjusted,
            unit_cost=payload.unitCost or 0.0,
            type=payload.type,
            reason=payload.reason,
            status="pending"
        )
        db.add(adj)
        db.commit()
        db.refresh(adj)
        return {
            "_id": str(adj.id),
            "itemCode": item.item_code,
            "itemName": item.name,
            "warehouseCode": wh.code,
            "quantityAdjusted": adj.quantity_adjusted,
            "type": adj.type,
            "reason": adj.reason,
            "status": adj.status
        }

    @staticmethod
    def approve_adjustment(db: Session, adjustment_id: str, status: str, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        try:
            adj_uuid = uuid.UUID(adjustment_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid adjustment ID")
            
        adj = db.query(InventoryAdjustment).filter(
            InventoryAdjustment.id == adj_uuid,
            InventoryAdjustment.tenant_id == tenant_id,
            InventoryAdjustment.deleted_at == None
        ).first()
        if not adj:
            raise HTTPException(status_code=404, detail="Adjustment request not found")
            
        if adj.status != "pending":
            raise HTTPException(status_code=400, detail="Adjustment has already been processed")

        adj.status = status
        adj.approved_by = author_id
        adj.approved_at = datetime.utcnow()

        if status == "approved":
            # Execute physical stock updates
            bal = balance_repo.get_balance(db, adj.item_id, adj.warehouse_id, adj.location_id, tenant_id)
            if not bal:
                bal = StockBalance(
                    tenant_id=tenant_id,
                    item_id=adj.item_id,
                    warehouse_id=adj.warehouse_id,
                    location_id=adj.location_id,
                    quantity=0.0,
                    reserved_quantity=0.0
                )
                db.add(bal)
                
            if adj.type == "in":
                bal.quantity += adj.quantity_adjusted
            else:
                if bal.quantity < adj.quantity_adjusted:
                    raise HTTPException(status_code=400, detail="Insufficient stock to apply negative adjustment")
                bal.quantity -= adj.quantity_adjusted

            # Record StockMovement
            mvt = StockMovement(
                tenant_id=tenant_id,
                item_id=adj.item_id,
                warehouse_id=adj.warehouse_id,
                location_id=adj.location_id,
                type="adjustment_in" if adj.type == "in" else "adjustment_out",
                quantity=adj.quantity_adjusted if adj.type == "in" else -adj.quantity_adjusted,
                unit_cost=adj.unit_cost,
                reference_type="adjustment",
                reference_id=str(adj.id),
                remarks=adj.reason
            )
            db.add(mvt)

            # Timeline log
            timeline = InventoryTimeline(
                tenant_id=tenant_id,
                item_id=adj.item_id,
                event_type="adjusted",
                details=f"Adjustment of {adj.quantity_adjusted} approved (Type: {adj.type}, Reason: {adj.reason})"
            )
            db.add(timeline)

        db.commit()
        db.refresh(adj)
        return {
            "_id": str(adj.id),
            "status": adj.status,
            "approvedAt": adj.approved_at.strftime("%Y-%m-%d %H:%M:%S") if adj.approved_at else None
        }

    @staticmethod
    def list_adjustments(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        adjs = db.query(InventoryAdjustment).filter(
            InventoryAdjustment.tenant_id == tenant_id,
            InventoryAdjustment.deleted_at == None
        ).all()
        result = []
        for a in adjs:
            item = db.query(InventoryItem).filter(InventoryItem.id == a.item_id).first()
            wh = db.query(Warehouse).filter(Warehouse.id == a.warehouse_id).first()
            result.append({
                "_id": str(a.id),
                "itemCode": item.item_code if item else "",
                "itemName": item.name if item else "",
                "warehouseCode": wh.code if wh else "",
                "quantityAdjusted": a.quantity_adjusted,
                "unitCost": a.unit_cost,
                "type": a.type,
                "reason": a.reason,
                "status": a.status,
                "createdAt": a.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return result

    # ── Cycle Counting & Physical Verification ──────────────────────────────
    @staticmethod
    def submit_cycle_count(db: Session, payload: CycleCountSubmitSchema, tenant_id: uuid.UUID, author_email: str) -> dict:
        wh = warehouse_repo.get_by_code(db, payload.warehouseCode, tenant_id)
        if not wh:
            raise HTTPException(status_code=404, detail="Warehouse not found")
            
        c_date = datetime.utcnow()
        if payload.countDate:
            c_date = datetime.strptime(payload.countDate, "%Y-%m-%d")
            
        count = InventoryCount(
            tenant_id=tenant_id,
            warehouse_id=wh.id,
            count_date=c_date,
            status="pending"
        )
        db.add(count)
        db.commit()
        db.refresh(count)

        for c_item in payload.items:
            item = item_repo.get_by_code(db, c_item.itemCode, tenant_id)
            if not item:
                continue
                
            loc_id = None
            if c_item.locationCode:
                loc = location_repo.get_by_code(db, wh.id, c_item.locationCode, tenant_id)
                if loc:
                    loc_id = loc.id
                    
            bal = balance_repo.get_balance(db, item.id, wh.id, loc_id, tenant_id)
            sys_qty = bal.quantity if bal else 0.0
            variance = c_item.countedQuantity - sys_qty
            
            c_detail = InventoryCountItem(
                tenant_id=tenant_id,
                count_id=count.id,
                item_id=item.id,
                location_id=loc_id,
                system_quantity=sys_qty,
                counted_quantity=c_item.countedQuantity,
                variance=variance,
                remarks=c_item.remarks
            )
            db.add(c_detail)
            
        db.commit()
        return {
            "_id": str(count.id),
            "warehouseCode": wh.code,
            "countDate": count.count_date.strftime("%Y-%m-%d"),
            "status": count.status
        }

    @staticmethod
    def approve_cycle_count(db: Session, count_id: str, status: str, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        try:
            c_uuid = uuid.UUID(count_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid count ID format")
            
        count = db.query(InventoryCount).filter(
            InventoryCount.id == c_uuid,
            InventoryCount.tenant_id == tenant_id
        ).first()
        if not count:
            raise HTTPException(status_code=404, detail="Cycle count record not found")
            
        if count.status != "pending":
            raise HTTPException(status_code=400, detail="Count has already been processed")
            
        count.status = status
        count.approved_by = author_id
        count.approved_at = datetime.utcnow()

        if status == "approved":
            # For each counting item with a variance, generate and auto-approve an InventoryAdjustment
            count_items = db.query(InventoryCountItem).filter(InventoryCountItem.count_id == count.id).all()
            for ci in count_items:
                if ci.variance == 0.0:
                    continue
                    
                # Calculate cost value
                cost_lookup = InventoryService.calculate_fifo_cost(db, ci.item_id, abs(ci.variance), tenant_id)
                unit_cost = cost_lookup["averageUnitCost"]
                
                adj = InventoryAdjustment(
                    tenant_id=tenant_id,
                    item_id=ci.item_id,
                    warehouse_id=count.warehouse_id,
                    location_id=ci.location_id,
                    quantity_adjusted=abs(ci.variance),
                    unit_cost=unit_cost,
                    type="in" if ci.variance > 0.0 else "out",
                    reason=f"Auto-adjustment from Cycle Count #{count_id}: {ci.remarks or 'Variance'}",
                    status="approved",
                    approved_by=author_id,
                    approved_at=datetime.utcnow()
                )
                db.add(adj)
                
                # Apply physical stock change
                bal = balance_repo.get_balance(db, ci.item_id, count.warehouse_id, ci.location_id, tenant_id)
                if not bal:
                    bal = StockBalance(
                        tenant_id=tenant_id,
                        item_id=ci.item_id,
                        warehouse_id=count.warehouse_id,
                        location_id=ci.location_id,
                        quantity=0.0,
                        reserved_quantity=0.0
                    )
                    db.add(bal)
                bal.quantity += ci.variance

                # Record StockMovement
                mvt = StockMovement(
                    tenant_id=tenant_id,
                    item_id=ci.item_id,
                    warehouse_id=count.warehouse_id,
                    location_id=ci.location_id,
                    type="adjustment_in" if ci.variance > 0.0 else "adjustment_out",
                    quantity=ci.variance,
                    unit_cost=unit_cost,
                    reference_type="count",
                    reference_id=str(count.id),
                    remarks=ci.remarks or "Cycle count adjustment"
                )
                db.add(mvt)
                
                # Timeline log
                timeline = InventoryTimeline(
                    tenant_id=tenant_id,
                    item_id=ci.item_id,
                    event_type="count",
                    details=f"Cycle count verification variance adjusted by {ci.variance} (Count ID: {count_id})"
                )
                db.add(timeline)

        db.commit()
        return {
            "_id": str(count.id),
            "status": count.status,
            "approvedAt": count.approved_at.strftime("%Y-%m-%d %H:%M:%S") if count.approved_at else None
        }

    @staticmethod
    def list_cycle_counts(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        counts = db.query(InventoryCount).filter(
            InventoryCount.tenant_id == tenant_id,
            InventoryCount.deleted_at == None
        ).all()
        result = []
        for c in counts:
            wh = db.query(Warehouse).filter(Warehouse.id == c.warehouse_id).first()
            items_count = db.query(InventoryCountItem).filter(InventoryCountItem.count_id == c.id).count()
            
            result.append({
                "_id": str(c.id),
                "warehouseCode": wh.code if wh else "",
                "warehouseName": wh.name if wh else "",
                "countDate": c.count_date.strftime("%Y-%m-%d"),
                "status": c.status,
                "itemsCheckedCount": items_count,
                "createdAt": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return result

    @staticmethod
    def get_cycle_count_details(db: Session, count_id: str, tenant_id: uuid.UUID) -> dict:
        try:
            c_uuid = uuid.UUID(count_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid count ID format")
            
        count = db.query(InventoryCount).filter(
            InventoryCount.id == c_uuid,
            InventoryCount.tenant_id == tenant_id
        ).first()
        if not count:
            raise HTTPException(status_code=404, detail="Count not found")
            
        wh = db.query(Warehouse).filter(Warehouse.id == count.warehouse_id).first()
        items = db.query(InventoryCountItem).filter(InventoryCountItem.count_id == count.id).all()
        
        serialized_items = []
        for ci in items:
            item = db.query(InventoryItem).filter(InventoryItem.id == ci.item_id).first()
            loc = db.query(WarehouseLocation).filter(WarehouseLocation.id == ci.location_id).first() if ci.location_id else None
            serialized_items.append({
                "itemCode": item.item_code if item else "",
                "itemName": item.name if item else "",
                "locationCode": loc.code if loc else None,
                "systemQuantity": ci.system_quantity,
                "countedQuantity": ci.counted_quantity,
                "variance": ci.variance,
                "remarks": ci.remarks
            })
            
        return {
            "_id": str(count.id),
            "warehouseCode": wh.code if wh else "",
            "countDate": count.count_date.strftime("%Y-%m-%d"),
            "status": count.status,
            "items": serialized_items
        }

    # ── Cost Valuation Engine (FIFO / LIFO / Average) ─────────────────────────
    @staticmethod
    def calculate_fifo_cost(db: Session, item_id: uuid.UUID, quantity: float, tenant_id: uuid.UUID) -> dict:
        # Get all positive movements (stock in entries)
        ins = db.query(StockMovement).filter(
            StockMovement.item_id == item_id,
            StockMovement.tenant_id == tenant_id,
            StockMovement.type.in_(["stock_in", "transfer_in", "adjustment_in"]),
            StockMovement.deleted_at == None
        ).order_by(StockMovement.created_at.asc()).all()

        # Get all negative movements (stock out entries)
        outs = db.query(StockMovement).filter(
            StockMovement.item_id == item_id,
            StockMovement.tenant_id == tenant_id,
            StockMovement.type.in_(["stock_out", "transfer_out", "adjustment_out"]),
            StockMovement.deleted_at == None
        ).order_by(StockMovement.created_at.asc()).all()

        total_consumed = sum([abs(o.quantity) for o in outs])
        
        # FIFO consumes from oldest ins first
        accumulated_in = 0.0
        remaining_qty_to_valuation = quantity
        total_valuation_cost = 0.0

        for m_in in ins:
            in_qty = m_in.quantity
            # Check how much of this entry was already consumed historically
            if accumulated_in + in_qty <= total_consumed:
                # This entire entry is already consumed
                accumulated_in += in_qty
                continue
                
            # Partial consumption on this entry
            available_in_this_entry = (accumulated_in + in_qty) - total_consumed
            if accumulated_in < total_consumed:
                # We start matching from here
                accumulated_in = total_consumed
                
            # Match current quantity with what is available in this entry
            matched_qty = min(remaining_qty_to_valuation, available_in_this_entry)
            total_valuation_cost += matched_qty * m_in.unit_cost
            remaining_qty_to_valuation -= matched_qty
            
            if remaining_qty_to_valuation <= 0:
                break
                
        # If not enough stock in records (fallback to current item config price or 0)
        if remaining_qty_to_valuation > 0:
            fallback_unit_price = 100.0 # Standard fallback
            total_valuation_cost += remaining_qty_to_valuation * fallback_unit_price

        avg_unit_cost = total_valuation_cost / quantity if quantity > 0 else 0.0
        return {
            "totalValuationCost": total_valuation_cost,
            "averageUnitCost": avg_unit_cost
        }

    @staticmethod
    def calculate_lifo_cost(db: Session, item_id: uuid.UUID, quantity: float, tenant_id: uuid.UUID) -> dict:
        # Same logic but LIFO consumes from newest ins first
        ins = db.query(StockMovement).filter(
            StockMovement.item_id == item_id,
            StockMovement.tenant_id == tenant_id,
            StockMovement.type.in_(["stock_in", "transfer_in", "adjustment_in"]),
            StockMovement.deleted_at == None
        ).order_by(StockMovement.created_at.desc()).all() # Sort in DESC order for LIFO

        # Compute cost average directly
        total_valuation_cost = 0.0
        remaining_qty = quantity
        for m_in in ins:
            matched_qty = min(remaining_qty, m_in.quantity)
            total_valuation_cost += matched_qty * m_in.unit_cost
            remaining_qty -= matched_qty
            if remaining_qty <= 0:
                break
                
        if remaining_qty > 0:
            total_valuation_cost += remaining_qty * 100.0
            
        avg_unit_cost = total_valuation_cost / quantity if quantity > 0 else 0.0
        return {
            "totalValuationCost": total_valuation_cost,
            "averageUnitCost": avg_unit_cost
        }

    @staticmethod
    def calculate_weighted_average_cost(db: Session, item_id: uuid.UUID, quantity: float, tenant_id: uuid.UUID) -> dict:
        ins = db.query(StockMovement).filter(
            StockMovement.item_id == item_id,
            StockMovement.tenant_id == tenant_id,
            StockMovement.type.in_(["stock_in", "transfer_in", "adjustment_in"]),
            StockMovement.deleted_at == None
        ).all()
        
        total_ins_qty = sum([m.quantity for m in ins])
        total_ins_cost = sum([m.quantity * m.unit_cost for m in ins])
        
        avg_cost = total_ins_cost / total_ins_qty if total_ins_qty > 0 else 100.0
        return {
            "totalValuationCost": quantity * avg_cost,
            "averageUnitCost": avg_cost
        }

    @staticmethod
    def get_stock_valuations(db: Session, method: str, tenant_id: uuid.UUID) -> List[dict]:
        items = db.query(InventoryItem).filter(InventoryItem.tenant_id == tenant_id, InventoryItem.deleted_at == None).all()
        result = []
        for item in items:
            # Get current stock balance total
            balances = db.query(StockBalance).filter(StockBalance.item_id == item.id, StockBalance.tenant_id == tenant_id).all()
            total_qty = sum([b.quantity for b in balances])
            
            if method.upper() == "FIFO":
                valuation = InventoryService.calculate_fifo_cost(db, item.id, total_qty, tenant_id)
            elif method.upper() == "LIFO":
                valuation = InventoryService.calculate_lifo_cost(db, item.id, total_qty, tenant_id)
            else:
                valuation = InventoryService.calculate_weighted_average_cost(db, item.id, total_qty, tenant_id)
                
            result.append({
                "itemCode": item.item_code,
                "itemName": item.name,
                "sku": item.sku,
                "uom": item.uom,
                "totalQuantity": total_qty,
                "averageUnitCost": valuation["averageUnitCost"],
                "totalValue": valuation["totalValuationCost"]
            })
        return result

    # ── AI Predictions, Forecasting & Analytics ───────────────────────────────
    @staticmethod
    def get_dashboard_summary(db: Session, tenant_id: uuid.UUID) -> dict:
        # Valuation totals
        valuations = InventoryService.get_stock_valuations(db, "AVERAGE", tenant_id)
        total_val = sum([v["totalValue"] for v in valuations])
        total_qty = sum([v["totalQuantity"] for v in valuations])
        
        # Low stock count
        low_stock_count = 0
        items = db.query(InventoryItem).filter(InventoryItem.tenant_id == tenant_id, InventoryItem.deleted_at == None).all()
        for item in items:
            balances = db.query(StockBalance).filter(StockBalance.item_id == item.id, StockBalance.tenant_id == tenant_id).all()
            qty = sum([b.quantity for b in balances])
            if qty <= item.reorder_point:
                low_stock_count += 1
                
        # Warehouse capacities
        whs = db.query(Warehouse).filter(Warehouse.tenant_id == tenant_id, Warehouse.deleted_at == None).all()
        capacity_summary = []
        for w in whs:
            w_bals = db.query(StockBalance).filter(StockBalance.warehouse_id == w.id, StockBalance.tenant_id == tenant_id).all()
            occupied = sum([b.quantity for b in w_bals])
            cap = w.capacity or 1000.0
            utilization = (occupied / cap) * 100.0 if cap > 0 else 0.0
            capacity_summary.append({
                "warehouseCode": w.code,
                "warehouseName": w.name,
                "capacity": cap,
                "occupied": occupied,
                "utilization": min(utilization, 100.0)
            })

        # Recent activities
        recent_mvts = db.query(StockMovement).filter(
            StockMovement.tenant_id == tenant_id
        ).order_by(StockMovement.created_at.desc()).limit(5).all()
        
        activities = []
        for rm in recent_mvts:
            it = db.query(InventoryItem).filter(InventoryItem.id == rm.item_id).first()
            activities.append({
                "itemCode": it.item_code if it else "",
                "itemName": it.name if it else "",
                "type": rm.type,
                "quantity": rm.quantity,
                "timestamp": rm.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        return {
            "totalValuation": total_val,
            "totalQuantity": total_qty,
            "lowStockAlertsCount": low_stock_count,
            "warehouseCapacities": capacity_summary,
            "recentActivities": activities
        }

    @staticmethod
    def get_analytics(db: Session, tenant_id: uuid.UUID) -> dict:
        # ABC analysis logic based on consumption value
        items = db.query(InventoryItem).filter(InventoryItem.tenant_id == tenant_id, InventoryItem.deleted_at == None).all()
        abc_details = []
        total_consumption_value = 0.0
        
        for it in items:
            # Sum stock out consumption value
            outs = db.query(StockMovement).filter(
                StockMovement.item_id == it.id,
                StockMovement.type == "stock_out",
                StockMovement.tenant_id == tenant_id
            ).all()
            cons_qty = sum([abs(o.quantity) for o in outs])
            
            # Weighted average cost
            valuation = InventoryService.calculate_weighted_average_cost(db, it.id, 1, tenant_id)
            val_cost = valuation["averageUnitCost"]
            cons_val = cons_qty * val_cost
            total_consumption_value += cons_val
            
            abc_details.append({
                "itemCode": it.item_code,
                "itemName": it.name,
                "consumptionValue": cons_val
            })
            
        # Sort descending by consumption value
        abc_details.sort(key=lambda x: x["consumptionValue"], reverse=True)
        
        running_sum = 0.0
        a_list, b_list, c_list = [], [], []
        for x in abc_details:
            running_sum += x["consumptionValue"]
            ratio = (running_sum / total_consumption_value) if total_consumption_value > 0 else 0.0
            
            if ratio <= 0.70:
                a_list.append(x)
                x["class"] = "A"
            elif ratio <= 0.90:
                b_list.append(x)
                x["class"] = "B"
            else:
                c_list.append(x)
                x["class"] = "C"

        return {
            "classACount": len(a_list),
            "classBCount": len(b_list),
            "classCCount": len(c_list),
            "items": abc_details
        }

    @staticmethod
    def get_reorder_suggestions(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        items = db.query(InventoryItem).filter(
            InventoryItem.tenant_id == tenant_id,
            InventoryItem.deleted_at == None
        ).all()
        suggestions = []
        for it in items:
            balances = db.query(StockBalance).filter(StockBalance.item_id == it.id, StockBalance.tenant_id == tenant_id).all()
            qty = sum([b.quantity for b in balances])
            
            if qty <= it.reorder_point:
                # Calculate simple EOQ (Economic Order Quantity)
                # D: Annual Demand, S: Ordering cost, H: Holding cost
                # Mock formula: EOQ = sqrt( (2 * AnnualDemand * 250) / (0.1 * UnitCost) )
                demand_outs = db.query(StockMovement).filter(
                    StockMovement.item_id == it.id,
                    StockMovement.type == "stock_out",
                    StockMovement.tenant_id == tenant_id
                ).all()
                annual_demand = sum([abs(o.quantity) for o in demand_outs]) * 12.0 or 120.0
                unit_cost = InventoryService.calculate_weighted_average_cost(db, it.id, 1, tenant_id)["averageUnitCost"] or 100.0
                holding_cost = max(unit_cost * 0.1, 1.0)
                
                eoq = math.sqrt((2 * annual_demand * 250.0) / holding_cost)
                recommended = max(math.ceil(eoq), 10.0)
                
                suggestions.append({
                    "itemCode": it.item_code,
                    "itemName": it.name,
                    "sku": it.sku,
                    "currentStock": qty,
                    "safetyStock": it.safety_stock,
                    "reorderPoint": it.reorder_point,
                    "recommendedOrderQuantity": recommended,
                    "preferredVendor": it.preferred_vendor or "Standard Vendor Partner",
                    "priority": "high" if qty <= it.safety_stock else "medium"
                })
        return suggestions

    @staticmethod
    def get_demand_forecast(db: Session, item_code: str, horizon_days: int, tenant_id: uuid.UUID) -> dict:
        item = item_repo.get_by_code(db, item_code, tenant_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
            
        # Get historical outbound transactions
        outs = db.query(StockMovement).filter(
            StockMovement.item_id == item.id,
            StockMovement.type == "stock_out",
            StockMovement.tenant_id == tenant_id
        ).all()
        
        hist_qty = sum([abs(o.quantity) for o in outs])
        avg_daily_demand = hist_qty / 30.0 if hist_qty > 0 else 5.0
        
        # Simulate simple forecast with a cosine seasonality factor
        forecast_points = []
        for day in range(1, horizon_days + 1):
            seasonality = 1.0 + 0.15 * math.cos(day * (2 * math.pi / 7)) # Weekly seasonality
            predicted = avg_daily_demand * seasonality
            forecast_points.append({
                "day": day,
                "predictedQuantity": round(predicted, 2),
                "confidenceScore": round(80.0 - (day * 0.5), 1) # Confidence decreases with time horizon
            })
            
        return {
            "itemCode": item_code,
            "itemName": item.name,
            "averageDailyDemand": avg_daily_demand,
            "forecastHorizonDays": horizon_days,
            "points": forecast_points
        }
