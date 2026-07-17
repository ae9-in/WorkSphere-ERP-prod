from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.inventory import (
    CategoryCreateSchema, InventoryItemCreateSchema, WarehouseCreateSchema,
    LocationCreateSchema, StockInSchema, StockOutSchema, StockTransferSchema,
    AdjustmentCreateSchema, AdjustmentApproveSchema, CycleCountSubmitSchema, PredictionRequestSchema,
    InventoryItemUpdateSchema, ReservationCreateSchema, QualityInspectionCreateSchema,
    LandedCostVoucherSchema, AssetAssignmentSchema, AssetReturnSchema, ImportCSVSchema,
    SupplierCreateSchema, PurchaseOrderCreateSchema, GoodsReceiptCreateSchema
)
from app.services.inventory import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])

# Category Endpoints
@router.post("/categories", status_code=201)
def create_category(payload: CategoryCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_category(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/categories")
def get_categories(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_categories(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Item Endpoints
@router.post("/items", status_code=201)
def create_item(payload: InventoryItemCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_item(db, payload, tenant_id=user.company_id, author_id=user.id, author_email=user.email)
    return {"success": True, "data": result}

@router.get("/items")
def get_items(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_items(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Warehouse Endpoints
@router.post("/warehouses", status_code=201)
def create_warehouse(payload: WarehouseCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_warehouse(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/warehouses")
def get_warehouses(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_warehouses(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Location Endpoints
@router.post("/locations", status_code=201)
def create_location(payload: LocationCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_location(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/locations")
def get_locations(warehouseCode: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_locations(db, warehouse_code=warehouseCode, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Core Transaction Endpoints
@router.post("/stock-in", status_code=201)
def stock_in(payload: StockInSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.stock_in(db, payload, tenant_id=user.company_id, author_email=user.email)
    return {"success": True, "data": result}

@router.post("/stock-out", status_code=201)
def stock_out(payload: StockOutSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.stock_out(db, payload, tenant_id=user.company_id, author_email=user.email)
    return {"success": True, "data": result}

@router.post("/transfers", status_code=201)
def transfer(payload: StockTransferSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.transfer(db, payload, tenant_id=user.company_id, author_email=user.email)
    return {"success": True, "data": result}

# Adjustments Endpoints
@router.post("/adjustments", status_code=201)
def create_adjustment(payload: AdjustmentCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_adjustment(db, payload, tenant_id=user.company_id, author_email=user.email)
    return {"success": True, "data": result}

@router.get("/adjustments")
def get_adjustments(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_adjustments(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/adjustments/{id}/approve")
def approve_adjustment(id: str, payload: AdjustmentApproveSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.approve_adjustment(db, adjustment_id=id, status=payload.status, tenant_id=user.company_id, author_id=user.id, author_email=user.email)
    return {"success": True, "data": result}

# Cycle Counts Endpoints
@router.post("/count", status_code=201)
def submit_count(payload: CycleCountSubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.submit_cycle_count(db, payload, tenant_id=user.company_id, author_email=user.email)
    return {"success": True, "data": result}

@router.get("/count")
def get_counts(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_cycle_counts(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/count/{id}")
def get_count_details(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_cycle_count_details(db, count_id=id, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/count/{id}/approve")
def approve_count(id: str, payload: AdjustmentApproveSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.approve_cycle_count(db, count_id=id, status=payload.status, tenant_id=user.company_id, author_id=user.id, author_email=user.email)
    return {"success": True, "data": result}

# Intelligence Endpoints
@router.get("/valuation")
def get_valuation(method: str = Query("AVERAGE"), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_stock_valuations(db, method=method, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/reorder")
def get_reorder_recommendations(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_reorder_suggestions(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/dashboard")
def get_dashboard(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_dashboard_summary(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/analytics")
def get_analytics(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_analytics(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/forecast")
def get_forecast(itemCode: str = Query(...), horizonDays: Optional[int] = Query(30), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_demand_forecast(db, item_code=itemCode, horizon_days=horizonDays, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/predict")
def simulate_prediction(payload: PredictionRequestSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.get_demand_forecast(db, item_code=payload.itemCode, horizon_days=payload.horizonDays or 30, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/optimization")
def get_optimization(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    dashboard = InventoryService.get_dashboard_summary(db, tenant_id=user.company_id)
    caps = dashboard["warehouseCapacities"]
    recommendations = []
    for c in caps:
        if c["utilization"] > 80.0:
            recommendations.append({
                "warehouseCode": c["warehouseCode"],
                "recommendation": "High utilization alert. Reallocate raw materials or consumables to under-utilized warehouse spaces.",
                "action": "spatial_optimization_triggered"
            })
        else:
            recommendations.append({
                "warehouseCode": c["warehouseCode"],
                "recommendation": "Capacity levels nominal. Picking route optimizer recommended to balance operators workload.",
                "action": "route_optimization_triggered"
            })
    return {"success": True, "data": recommendations}

# New Upgraded Inventory Endpoints
@router.put("/items/{id}")
def update_item(id: str, payload: InventoryItemUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    # Restrict write operations to Admin or Operations manager (for presentation, we log and enforce tenant match)
    result = InventoryService.update_item(db, item_id=id, payload=payload.dict(exclude_unset=True), tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.delete("/items/{id}")
def delete_item(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.delete_item(db, item_id=id, tenant_id=user.company_id)
    return {"success": True, "message": "Item deleted successfully"}

@router.get("/reservations")
def get_reservations(itemId: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    query = db.query(StockReservation).filter(StockReservation.tenant_id == user.company_id, StockReservation.status == "active")
    if itemId:
        try:
            item_uuid = uuid.UUID(itemId)
            query = query.filter(StockReservation.item_id == item_uuid)
        except ValueError:
            pass
    results = query.all()
    data = []
    for r in results:
        item = db.query(InventoryItem).filter(InventoryItem.id == r.item_id).first()
        wh = db.query(Warehouse).filter(Warehouse.id == r.warehouse_id).first()
        data.append({
            "_id": str(r.id),
            "itemCode": item.item_code if item else "",
            "itemName": item.name if item else "",
            "warehouseCode": wh.code if wh else "",
            "quantity": r.quantity,
            "referenceType": r.reference_type,
            "referenceId": r.reference_id,
            "expiryDate": r.expiry_date.strftime("%Y-%m-%d") if r.expiry_date else None
        })
    return {"success": True, "data": data}

@router.post("/reservations", status_code=201)
def create_reservation(payload: ReservationCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_reservation(db, payload=payload.dict(), tenant_id=user.company_id, user_id=user.id)
    return {"success": True, "data": result}

@router.delete("/reservations/{id}")
def cancel_reservation(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.cancel_reservation(db, res_id=id, tenant_id=user.company_id)
    return {"success": True, "message": "Reservation cancelled successfully"}

@router.post("/inspections", status_code=201)
def submit_inspection(payload: QualityInspectionCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.submit_quality_inspection(db, payload=payload.dict(), tenant_id=user.company_id, user_id=user.id)
    return {"success": True, "data": result}

@router.post("/landed-costs", status_code=201)
def post_landed_costs(payload: LandedCostVoucherSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.allocate_landed_costs(db, payload=payload.dict(), tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/serials/assign")
def assign_serial_asset(payload: AssetAssignmentSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.assign_serial_asset(db, payload=payload.dict(), tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/serials/return")
def return_serial_asset(payload: AssetReturnSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.return_serial_asset(db, payload=payload.dict(), tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/items/import")
def import_items(payload: ImportCSVSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    count = InventoryService.import_items_csv(db, payload=[item.dict() for item in payload.items], tenant_id=user.company_id)
    return {"success": True, "importedCount": count}

# Supplier Endpoints
@router.post("/suppliers", status_code=201)
def create_supplier(payload: SupplierCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_supplier(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/suppliers")
def get_suppliers(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_suppliers(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Purchase Order Endpoints
@router.post("/purchase-orders", status_code=201)
def create_purchase_order(payload: PurchaseOrderCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_purchase_order(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/purchase-orders")
def get_purchase_orders(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_purchase_orders(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Goods Receipt Endpoints
@router.post("/goods-receipts", status_code=201)
def create_goods_receipt(payload: GoodsReceiptCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.create_goods_receipt(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/goods-receipts")
def get_goods_receipts(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = InventoryService.list_goods_receipts(db, tenant_id=user.company_id)
    return {"success": True, "data": result}
