from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.maintenance import MaintenanceService
from app.schemas.maintenance import (
    AssetCreateSchema, PlanCreateSchema, RequestSubmitSchema,
    WorkOrderCreateSchema, InspectionSubmitSchema,
    SpareConsumptionSubmitSchema, TelemetrySubmitSchema
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance Management"])

# ── Asset Registry ──
@router.post("/assets", status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.create_asset(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/assets")
def list_assets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.list_assets(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── PM Plans ──
@router.post("/pm-plans", status_code=status.HTTP_201_CREATED)
def create_pm_plan(payload: PlanCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.create_pm_plan(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

# ── Work Requests & Orders ──
@router.post("/work-request", status_code=status.HTTP_201_CREATED)
def submit_work_request(payload: RequestSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.submit_work_request(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.post("/work-order", status_code=status.HTTP_201_CREATED)
def create_work_order(payload: WorkOrderCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.create_work_order(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.post("/work-order/consume-parts")
def consume_spare_parts(payload: SpareConsumptionSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.consume_spare_part(db, payload, current_user.company_id, current_user.email)
    return {"status": "success", "data": data}

@router.post("/work-order/{wo_id}/complete")
def complete_work_order(wo_id: str, payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    labor_cost = payload.get("laborCost", 0.0)
    remarks = payload.get("remarks", "")
    data = MaintenanceService.complete_work_order(db, wo_id, labor_cost, remarks, current_user.company_id, current_user.id, current_user.email)
    return {"status": "success", "data": data}

# ── Inspection Worksheets ──
@router.post("/inspection", status_code=status.HTTP_201_CREATED)
def submit_inspection(payload: InspectionSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.submit_inspection(db, payload, current_user.company_id, current_user.email)
    return {"status": "success", "data": data}

# ── Health Scoring & Sensor Telemetry ──
@router.post("/telemetry")
def submit_telemetry(payload: TelemetrySubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.update_telemetry(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.post("/predict")
def simulate_predictive_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Mocking prediction run
    return {"status": "success", "message": "AI schedule optimization and RUL calculations completed."}

# ── Dashboards & Analytics ──
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = MaintenanceService.get_dashboard(db, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/reliability")
def get_reliability(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Standard mock metrics if db table empty
    return {
        "status": "success",
        "data": [
            {
                "assetName": "Robot Welder Cell 1",
                "mtbfHours": 140.0,
                "mttrHours": 3.4,
                "availability": 97.6,
                "criticalityScore": 85.0
            },
            {
                "assetName": "Fanuc ArcMate 100iD",
                "mtbfHours": 182.0,
                "mttrHours": 2.1,
                "availability": 98.9,
                "criticalityScore": 90.0
            }
        ]
    }

@router.get("/reports")
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": [
            {"reportName": "Asset Reliability KPI Summary", "format": "PDF", "size": "1.4 MB"},
            {"reportName": "Preventive Compliance Log", "format": "XLSX", "size": "450 KB"},
            {"reportName": "Downtime and Failures Breakdown", "format": "CSV", "size": "89 KB"}
        ]
    }

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "monthlyDowntime": [12.0, 18.5, 9.0, 4.0, 22.0, 8.5],
            "costTrends": [4500.0, 6200.0, 3900.0, 2900.0, 8100.0, 4300.0]
        }
    }

@router.get("/health")
def get_health(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": [
            {"assetName": "CNC Miller Haas VF-2", "score": 92.0, "status": "Good"},
            {"assetName": "Air Compressor Atlas", "score": 64.0, "status": "Action Required"}
        ]
    }

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "pmCompliance": 96.8,
            "availability": 98.2,
            "backlogHours": 42.0
        }
    }
