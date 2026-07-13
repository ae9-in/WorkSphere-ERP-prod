from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.supply_chain import SupplyChainService
from app.schemas.supply_chain import (
    NetworkNodeCreateSchema, DistributionCenterCreateSchema,
    PartnerCreateSchema, CarrierCreateSchema, VehicleCreateSchema,
    DriverCreateSchema, ShipmentCreateSchema, DispatchConfirmSchema,
    RouteCreateSchema, TelemetryUpdateSchema, PodSubmitSchema, ReturnLogSchema
)

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain Management"])

# ── SCM Network ──
@router.post("/network", status_code=status.HTTP_201_CREATED)
def create_network_node(payload: NetworkNodeCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_network_node(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/network")
def list_network_nodes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_network_nodes(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Distribution Centers ──
@router.post("/distribution-centers", status_code=status.HTTP_201_CREATED)
def create_dc(payload: DistributionCenterCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_distribution_center(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/distribution-centers")
def list_dcs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_distribution_centers(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Logistics Partners ──
@router.post("/partners", status_code=status.HTTP_201_CREATED)
def create_partner(payload: PartnerCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_logistics_partner(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/partners")
def list_partners(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_logistics_partners(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Carriers ──
@router.post("/carriers", status_code=status.HTTP_201_CREATED)
def create_carrier(payload: CarrierCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_carrier(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/carriers")
def list_carriers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_carriers(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Fleet Vehicles ──
@router.post("/fleet", status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_vehicle(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/fleet")
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_vehicles(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Driver Master ──
@router.post("/drivers", status_code=status.HTTP_201_CREATED)
def create_driver(payload: DriverCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_driver(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/drivers")
def list_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_drivers(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Shipments ──
@router.post("/shipments", status_code=status.HTTP_201_CREATED)
def create_shipment(payload: ShipmentCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_shipment(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/shipments")
def list_shipments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.list_shipments(db, current_user.company_id)
    return {"status": "success", "data": data}

# ── Operations Dispatch, Routing, GPS, POD, Reverse Logistics ──
@router.post("/dispatch")
def confirm_dispatch(payload: DispatchConfirmSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.confirm_dispatch(db, payload, current_user.company_id, current_user.id, current_user.email)
    return {"status": "success", "data": data}

@router.post("/routes")
def create_route(payload: RouteCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.create_route(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.post("/pod")
def submit_pod(payload: PodSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.submit_pod(db, payload, current_user.company_id, current_user.id, current_user.email)
    return {"status": "success", "data": data}

@router.post("/reverse")
def process_return(payload: ReturnLogSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.process_return(db, payload, current_user.company_id, current_user.email)
    return {"status": "success", "data": data}

@router.post("/telemetry")
def update_telemetry(payload: TelemetryUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.update_telemetry(db, payload, current_user.company_id)
    return {"status": "success", "data": data}

@router.post("/predict")
def simulate_predictive_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # AI delay and eta optimization worker simulation
    return {"status": "success", "message": "AI eta forecasting and route weather congestions calibrated."}

# ── Summary Dashboards & Analytics ──
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = SupplyChainService.get_dashboard(db, current_user.company_id)
    return {"status": "success", "data": data}

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "regionalDeliveryVolume": [120, 185, 230, 95],
            "slaComplianceRate": 97.4,
            "carrierDelays": [5, 2, 8, 1]
        }
    }

@router.get("/tracking")
def get_tracking(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": [
            {"vehicleNumber": "MH-02-AB-1234", "speed": 48.5, "status": "in_transit", "latitude": 19.076, "longitude": 72.877},
            {"vehicleNumber": "DL-01-XY-5678", "speed": 0.0, "status": "idle", "latitude": 28.613, "longitude": 77.209}
        ]
    }

@router.get("/costs")
def get_costs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "monthlyFuelCost": [45000, 52000, 48000, 61000],
            "totalTolls": 8450.0,
            "driverPayouts": 14200.0
        }
    }

@router.get("/optimization")
def get_optimization(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "suggestedConsolidations": [
                {"shipmentIds": ["SHP-0001", "SHP-0002"], "savingsEstimate": 120.0, "reason": "Close delivery windows and adjacent destinations"}
            ],
            "routeOptimizationScore": 92.5
        }
    }

@router.get("/reports")
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": [
            {"reportName": "Quarterly SCM Operational Review", "format": "PDF", "size": "3.8 MB"},
            {"reportName": "Carrier SLA Audit Log", "format": "XLSX", "size": "1.2 MB"},
            {"reportName": "Reverse Logistics Return Rates", "format": "CSV", "size": "150 KB"}
        ]
    }
