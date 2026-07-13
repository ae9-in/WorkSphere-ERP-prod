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
    AdjustmentCreateSchema, AdjustmentApproveSchema, CycleCountSubmitSchema, PredictionRequestSchema
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
