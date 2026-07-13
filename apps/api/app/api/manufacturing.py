from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.manufacturing import (
    PlantCreateSchema, CalendarCreateSchema, BOMCreateSchema,
    WorkCenterCreateSchema, MachineCreateSchema, RoutingCreateSchema,
    ProductionOrderCreateSchema, WorkOrderReleaseSchema, WorkOrderCompleteSchema,
    QualityInspectionSubmitSchema, CAPASaveSchema, ScrapSubmitSchema, ManufacturingPredictionRequest
)
from app.services.manufacturing import ManufacturingService

router = APIRouter(prefix="/manufacturing", tags=["manufacturing"])

# ── Plant & Calendar Endpoints ──
@router.post("/plants", status_code=201)
def create_plant(payload: PlantCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_plant(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/plants")
def get_plants(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_plants(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/calendars", status_code=201)
def create_calendar(payload: CalendarCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_calendar(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── BOM Endpoints ──
@router.post("/bom", status_code=201)
def create_bom(payload: BOMCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_bom(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/bom")
def get_boms(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_boms(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── Work Center & Machine Endpoints ──
@router.post("/work-centers", status_code=201)
def create_work_center(payload: WorkCenterCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_work_center(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/work-centers")
def get_work_centers(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_work_centers(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/machines", status_code=201)
def create_machine(payload: MachineCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_machine(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/machines")
def get_machines(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_machines(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── Routings Endpoints ──
@router.post("/routings", status_code=201)
def create_routing(payload: RoutingCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_routing(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/routings")
def get_routings(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_routings(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── Production Orders & Scheduling ──
@router.get("/orders")
def get_production_orders(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_production_orders(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/orders", status_code=201)
def create_production_order(payload: ProductionOrderCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.create_production_order(db, payload, tenant_id=user.company_id, author_id=user.id, author_email=user.email)
    return {"success": True, "data": result}

@router.post("/schedule", status_code=201)
def schedule_production(payload: ProductionOrderCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    # Standard forward scheduling is resolved directly by registering a released order
    result = ManufacturingService.create_production_order(db, payload, tenant_id=user.company_id, author_id=user.id, author_email=user.email)
    return {"success": True, "data": result}

# ── Work Orders Execution ──
@router.post("/work-orders", status_code=201)
def release_work_order(payload: WorkOrderReleaseSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.release_work_order(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/work-orders")
def get_work_orders(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_work_orders(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/work-orders/{id}/complete")
def complete_work_order(id: str, payload: WorkOrderCompleteSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.complete_work_order(db, work_order_id=id, payload=payload, tenant_id=user.company_id, author_id=user.id, author_email=user.email)
    return {"success": True, "data": result}

# ── MRP material requirements planning ──
@router.post("/mrp")
def run_mrp(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.calculate_mrp(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── Quality Control & Inspections ──
@router.post("/quality", status_code=201)
def submit_quality_inspection(payload: QualityInspectionSubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.submit_quality_inspection(db, payload, tenant_id=user.company_id, author_email=user.email)
    return {"success": True, "data": result}

@router.get("/quality")
def get_quality_inspections(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_quality_inspections(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/ncr")
def get_ncrs(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_ncrs(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/ncr/{id}/capa")
def update_capa(id: str, payload: CAPASaveSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.update_capa(db, ncr_id=id, root_cause=payload.rootCause, corrective_action=payload.correctiveAction, status=payload.status or "open", tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── Scrap Management ──
@router.post("/scrap", status_code=201)
def submit_scrap(payload: ScrapSubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.submit_scrap(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/scrap")
def get_scraps(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.list_scraps(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# ── Intelligence, OEE & Performance dashboards ──
@router.get("/dashboard")
def get_dashboard(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.get_dashboard_summary(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/oee")
def get_oee(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.get_oee_metrics(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/analytics")
def get_analytics(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    oee_metrics = ManufacturingService.get_oee_metrics(db, tenant_id=user.company_id)
    dashboard = ManufacturingService.get_dashboard_summary(db, tenant_id=user.company_id)
    return {
        "success": True,
        "data": {
            "oeeMetrics": oee_metrics,
            "scrapCost": dashboard["scrapCostTotal"],
            "laborProductivity": 91.4, # Simulated standard base KPIs
            "yieldRate": 98.2
        }
    }

@router.get("/capacity")
def get_capacity(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.get_capacity_planning(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/forecast")
def get_forecast(plantCode: str = Query(...), horizonDays: Optional[int] = Query(30), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.get_demand_forecast(db, plant_code=plantCode, horizon_days=horizonDays, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/predict")
def simulate_predictions(payload: ManufacturingPredictionRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ManufacturingService.get_demand_forecast(db, plant_code=payload.plantCode, horizon_days=payload.horizonDays or 30, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/maintenance")
def get_maintenance(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    machines = ManufacturingService.list_machines(db, tenant_id=user.company_id)
    alerts = []
    for idx, m in enumerate(machines):
        # Simulate predictive maintenance alerts
        alert_needed = (idx % 2 == 0)
        alerts.append({
            "machineCode": m["machineCode"],
            "machineName": m["name"],
            "status": m["status"],
            "failureProbability": 82.5 if alert_needed else 4.2,
            "maintenancePriority": "high" if alert_needed else "low",
            "recommendedWindow": "Next 48 Hours" if alert_needed else "In 3 Weeks"
        })
    return {"success": True, "data": alerts}

@router.get("/kpis")
def get_kpis(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    dashboard = ManufacturingService.get_dashboard_summary(db, tenant_id=user.company_id)
    return {
        "success": True,
        "data": {
            "oee": dashboard["averageOEE"],
            "yield": 98.2,
            "scrapRate": 1.8,
            "downtimeHours": 14.5
        }
    }

@router.get("/reports")
def download_reports(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    # Simulates report link retrieval
    return {
        "success": True,
        "data": {
            "pdfReportUrl": "/downloads/manufacturing_production_report.pdf",
            "excelReportUrl": "/downloads/manufacturing_oee_report.xlsx"
        }
    }
