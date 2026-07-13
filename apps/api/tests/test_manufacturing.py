from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_manufacturing_operations_lifecycle():
    # ── 1. SIGNUP & SETUP TENANT CONTEXT ──
    email = f"prod_mgr_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Production",
        "lastName": "Manager",
        "fullName": "Production Manager",
        "companyName": f"Heavy Industries {random_string().upper()}",
        "domain": f"manufacturing_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initialize company settings context
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # ── 2. CREATE INVENTORY ITEMS FOR BOM ──
    # Create inventory category
    cat_res = client.post("/api/inventory/categories", json={
        "code": "MANU",
        "name": "Manufacturing Items",
        "description": "Raw and finished industrial items"
    }, headers=headers)
    assert cat_res.status_code == 201

    # Create warehouse
    wh_res = client.post("/api/inventory/warehouses", json={
        "code": "WH-MUM",
        "name": "Mumbai Factory Storage",
        "capacity": 5000.0,
        "type": "distribution"
    }, headers=headers)
    assert wh_res.status_code == 201

    # Create location
    client.post("/api/inventory/locations", json={
        "warehouseCode": "WH-MUM",
        "code": "BIN-A",
        "zone": "Zone A"
    }, headers=headers)

    # Create component item (raw material)
    comp_res = client.post("/api/inventory/items", json={
        "name": "Raw Steel Plates",
        "categoryCode": "MANU",
        "uom": "kg",
        "minStock": 10.0,
        "reorderPoint": 20.0,
        "defaultWarehouseCode": "WH-MUM"
    }, headers=headers)
    assert comp_res.status_code == 201
    comp_code = comp_res.json()["data"]["itemCode"]

    # Add stock of raw material
    stock_res = client.post("/api/inventory/stock-in", json={
        "itemCode": comp_code,
        "warehouseCode": "WH-MUM",
        "locationCode": "BIN-A",
        "quantity": 100.0,
        "unitCost": 50.0,
        "remarks": "Raw material stock intake"
    }, headers=headers)
    assert stock_res.status_code == 201

    # Create end product item (finished good)
    prod_res = client.post("/api/inventory/items", json={
        "name": "Welded Steel Frames",
        "categoryCode": "MANU",
        "uom": "piece",
        "minStock": 5.0,
        "reorderPoint": 10.0,
        "defaultWarehouseCode": "WH-MUM"
    }, headers=headers)
    assert prod_res.status_code == 201
    prod_code = prod_res.json()["data"]["itemCode"]

    # ── 3. CREATE MANUFACTURING PLANT AND CALENDAR ──
    plant_res = client.post("/api/manufacturing/plants", json={
        "code": "PLANT-01",
        "name": "Core Welding Facility",
        "address": "GIDC Block 5"
    }, headers=headers)
    assert plant_res.status_code == 201
    plant_data = plant_res.json()["data"]

    cal_res = client.post("/api/manufacturing/calendars", json={
        "plantId": plant_data["_id"],
        "name": "Standard Shift Calendar",
        "workingDays": "Monday,Tuesday,Wednesday,Thursday,Friday"
    }, headers=headers)
    assert cal_res.status_code == 201

    # ── 4. CREATE WORK CENTER AND MACHINE ASSETS ──
    wc_res = client.post("/api/manufacturing/work-centers", json={
        "code": "WC-WELD",
        "name": "Robot Welding Cell 1",
        "department": "Assembly Welding",
        "capacity": 200.0
    }, headers=headers)
    assert wc_res.status_code == 201

    machine_res = client.post("/api/manufacturing/machines", json={
        "machineCode": "MAC-ROB-01",
        "name": "Welding Robot Fanuc ArcMate",
        "equipmentType": "Industrial Robotic Welder"
    }, headers=headers)
    assert machine_res.status_code == 201

    # ── 5. CREATE BOM AND OPERATIONS ROUTINGS ──
    bom_res = client.post("/api/manufacturing/bom", json={
        "bomNumber": "BOM-FRAME-01",
        "productItemCode": prod_code,
        "version": "1.0.0",
        "components": [
            {
                "itemCode": comp_code,
                "quantity": 2.5,
                "uom": "kg"
            }
        ]
    }, headers=headers)
    assert bom_res.status_code == 201

    routing_res = client.post("/api/manufacturing/routings", json={
        "code": "ROUTE-FRAME-01",
        "name": "Standard Frame Routing",
        "productItemCode": prod_code,
        "version": "1.0.0",
        "operations": [
            {
                "sequence": 10,
                "workCenterCode": "WC-WELD",
                "machineCode": "MAC-ROB-01",
                "standardTime": 0.5,
                "setupTime": 0.05,
                "laborTime": 0.5,
                "isInspectionPoint": True,
                "outputQuantity": 1.0
            }
        ]
    }, headers=headers)
    assert routing_res.status_code == 201

    # ── 6. RELEASE PRODUCTION ORDER AND RUN MRP ──
    po_res = client.post("/api/manufacturing/orders", json={
        "orderNumber": "ORD-2026-01",
        "itemCode": prod_code,
        "bomNumber": "BOM-FRAME-01",
        "routingCode": "ROUTE-FRAME-01",
        "quantity": 10.0,
        "plantCode": "PLANT-01"
      }, headers=headers)
    assert po_res.status_code == 201
    po_id = po_res.json()["data"]["_id"]

    # Run MRP calculations
    mrp_res = client.post("/api/manufacturing/mrp", headers=headers)
    assert mrp_res.status_code == 200
    mrp_data = mrp_res.json()["data"]
    # Required steel plates = 2.5 kg * 10 = 25 kg
    assert mrp_data[0]["requiredQuantity"] == 25.0
    assert mrp_data[0]["onHandQuantity"] == 100.0
    assert mrp_data[0]["shortageQuantity"] == 0.0

    # ── 7. DISPATCH WORK ORDER & EXECUTE COMPLETIONS ──
    wo_res = client.post("/api/manufacturing/work-orders", json={
        "productionOrderId": po_id,
        "workCenterCode": "WC-WELD",
        "machineCode": "MAC-ROB-01",
        "plannedQuantity": 10.0
    }, headers=headers)
    assert wo_res.status_code == 201
    wo_id = wo_res.json()["data"]["_id"]

    # Complete work order and record batch materials consumed
    complete_res = client.post(f"/api/manufacturing/work-orders/{wo_id}/complete", json={
        "producedQuantity": 10.0,
        "scrapQuantity": 0.5,
        "rejectedQuantity": 0.0,
        "consumptions": [
            {
                "itemCode": comp_code,
                "warehouseCode": "WH-MUM",
                "locationCode": "BIN-A",
                "quantityConsumed": 25.0
            }
        ],
        "remarks": "Job completed successfully"
    }, headers=headers)
    assert complete_res.status_code == 200

    # Check inventory is consumed and updated
    # Raw Steel Plates stock remaining should be 100.0 - 25.0 = 75.0 kg
    # Welded Steel Frames stock should be 10.0 pieces
    val_res = client.get("/api/inventory/valuation", headers=headers)
    assert val_res.status_code == 200
    val_comps = next(x for x in val_res.json()["data"] if x["itemCode"] == comp_code)
    val_prods = next(x for x in val_res.json()["data"] if x["itemCode"] == prod_code)
    assert val_comps["totalQuantity"] == 75.0
    assert val_prods["totalQuantity"] == 10.0

    # ── 8. SUBMIT QUALITY SHEETS & PROCESS CAPA ──
    # Submit quality check that fails (reject)
    qi_res = client.post("/api/manufacturing/quality", json={
        "workOrderNumber": "WO-0001",
        "itemCode": prod_code,
        "stage": "final",
        "result": "reject",
        "remarks": "Outer layer welding seam cracked"
    }, headers=headers)
    assert qi_res.status_code == 201
    ncr_id = qi_res.json()["data"]["ncrId"]
    assert ncr_id is not None

    # Check NCR list
    ncr_list_res = client.get("/api/manufacturing/ncr", headers=headers)
    assert ncr_list_res.status_code == 200
    assert len(ncr_list_res.json()["data"]) == 1

    # Update CAPA corrective actions
    capa_res = client.post(f"/api/manufacturing/ncr/{ncr_id}/capa", json={
        "defectDetails": "Outer layer welding seam cracked",
        "rootCause": "Welding tool gas supply pressure drop",
        "correctiveAction": "Calibrated pressure sensor and replaced gas valve",
        "status": "closed"
    }, headers=headers)
    assert capa_res.status_code == 200

    # ── 9. ANALYTICS, OEE AND PREDICTIVE CHECKS ──
    dash_res = client.get("/api/manufacturing/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["data"]["totalPlants"] == 1

    oee_res = client.get("/api/manufacturing/oee", headers=headers)
    assert oee_res.status_code == 200
    assert oee_res.json()["data"][0]["machineCode"] == "MAC-ROB-01"

    maint_res = client.get("/api/manufacturing/maintenance", headers=headers)
    assert maint_res.status_code == 200

    capacity_res = client.get("/api/manufacturing/capacity", headers=headers)
    assert capacity_res.status_code == 200
    assert capacity_res.json()["data"][0]["workCenterCode"] == "WC-WELD"
