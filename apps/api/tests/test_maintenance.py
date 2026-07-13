from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_maintenance_lifecycle():
    # ── 1. SIGNUP & SETUP TENANT CONTEXT ──
    email = f"maint_mgr_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Maintenance",
        "lastName": "Manager",
        "fullName": "Maintenance Manager",
        "companyName": f"Heavy Industries {random_string().upper()}",
        "domain": f"maintenance_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initialize company settings context
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # ── 2. CREATE INVENTORY ITEMS FOR SPARE PARTS ──
    # Create inventory category
    cat_res = client.post("/api/inventory/categories", json={
        "code": "SPARE",
        "name": "Spare Parts Catalog",
        "description": "Equipment spare parts"
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

    # Create component item (raw material / spare)
    comp_res = client.post("/api/inventory/items", json={
        "name": "Replacement CNC Spindle Valves",
        "categoryCode": "SPARE",
        "uom": "piece",
        "minStock": 2.0,
        "reorderPoint": 5.0,
        "defaultWarehouseCode": "WH-MUM"
    }, headers=headers)
    assert comp_res.status_code == 201
    comp_code = comp_res.json()["data"]["itemCode"]

    # Add stock of spare parts
    stock_res = client.post("/api/inventory/stock-in", json={
        "itemCode": comp_code,
        "warehouseCode": "WH-MUM",
        "locationCode": "BIN-A",
        "quantity": 10.0,
        "unitCost": 150.0,
        "remarks": "Initial spare parts stock intake"
    }, headers=headers)
    assert stock_res.status_code == 201

    # ── 3. ASSET REGISTRATION ──
    asset_res = client.post("/api/v1/maintenance/assets", json={
        "assetCode": "CNC-HAAS-VF2",
        "name": "Vertical Milling Center Haas VF-2",
        "category": "CNC Machines",
        "manufacturer": "Haas Automation",
        "model": "VF-2YT",
        "serialNumber": "SN-HAAS-99211",
        "department": "Milling Cell A"
    }, headers=headers)
    assert asset_res.status_code == 201
    asset_id = asset_res.json()["data"]["_id"]

    # Check assets list
    assets_list = client.get("/api/v1/maintenance/assets", headers=headers)
    assert assets_list.status_code == 200
    assert len(assets_list.json()["data"]) >= 1

    # ── 4. CREATE PM PLAN & SCHEDULING ──
    plan_res = client.post("/api/v1/maintenance/pm-plans", json={
        "planNumber": "PM-CNC-VF2-M",
        "assetId": asset_id,
        "maintenanceType": "preventive",
        "frequency": "monthly",
        "estimatedDuration": 2.5,
        "safetyInstructions": "Verify high voltage cutoff switch tag is set"
    }, headers=headers)
    assert plan_res.status_code == 201

    # ── 5. SUBMIT CORRECTIVE REQUEST & RELEASE WORK ORDER ──
    req_res = client.post("/api/v1/maintenance/work-request", json={
        "assetId": asset_id,
        "problemDescription": "Spindle motor temperature spike above 78C limits",
        "priority": "critical",
        "department": "Milling Cell A"
    }, headers=headers)
    assert req_res.status_code == 201
    req_id = req_res.json()["data"]["_id"]

    # Dispatch work order
    wo_res = client.post("/api/v1/maintenance/work-order", json={
        "assetId": asset_id,
        "requestId": req_id,
        "maintenanceType": "corrective",
        "estimatedLaborHours": 3.0,
        "safetyChecklist": "Wear thermal gloves and verify power isolation."
    }, headers=headers)
    assert wo_res.status_code == 201
    wo_id = wo_res.json()["data"]["_id"]

    # ── 6. CONSUME SPARES & COMPLETE WORK ORDER ──
    consume_res = client.post("/api/v1/maintenance/work-order/consume-parts", json={
        "workOrderId": wo_id,
        "itemCode": comp_code,
        "quantityConsumed": 2.0,
        "warehouseCode": "WH-MUM",
        "locationCode": "BIN-A"
    }, headers=headers)
    assert consume_res.status_code == 200

    # Verify inventory is deducted properly
    val_res = client.get("/api/inventory/valuation", headers=headers)
    assert val_res.status_code == 200
    val_item = next(x for x in val_res.json()["data"] if x["itemCode"] == comp_code)
    # Remaining spare parts = 10.0 - 2.0 = 8.0 pieces
    assert val_item["totalQuantity"] == 8.0

    # Complete the Work Order
    complete_res = client.post(f"/api/v1/maintenance/work-order/{wo_id}/complete", json={
        "laborCost": 220.0,
        "remarks": "Replaced thermal sensor valves, calibrated rotor shaft."
    }, headers=headers)
    assert complete_res.status_code == 200

    # ── 7. INSPECTIONS & CHECKLISTS ──
    inspect_res = client.post("/api/v1/maintenance/inspection", json={
        "assetId": asset_id,
        "workOrderId": wo_id,
        "stage": "calibration",
        "result": "fail",
        "remarks": "Spindle concentricity alignment failed tolerances"
    }, headers=headers)
    assert inspect_res.status_code == 201

    # Inspecting failing check should update asset status to down
    updated_assets = client.get("/api/v1/maintenance/assets", headers=headers)
    asset_record = next(x for x in updated_assets.json()["data"] if x["_id"] == asset_id)
    assert asset_record["status"] == "down"

    # ── 8. AI TELEMETRY HEALTH SENSORS ──
    # Post telemetry data that triggers high-vibration warning
    telemetry_res = client.post("/api/v1/maintenance/telemetry", json={
        "assetId": asset_id,
        "temperature": 82.5, # >75 triggers warning
        "vibration": 0.55,   # >0.40 triggers warning
        "runtimeHours": 10.0,
        "operatingHours": 10.0
    }, headers=headers)
    assert telemetry_res.status_code == 200
    assert telemetry_res.json()["data"]["healthScore"] <= 70.0
    assert telemetry_res.json()["data"]["predictiveAlertCreated"] is True

    # ── 9. DASHBOARD AND RELIABILITY ANALYTICS ──
    dash_res = client.get("/api/v1/maintenance/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["data"]["totalAssets"] == 1

    reliability_res = client.get("/api/v1/maintenance/reliability", headers=headers)
    assert reliability_res.status_code == 200

    reports_res = client.get("/api/v1/maintenance/reports", headers=headers)
    assert reports_res.status_code == 200

    analytics_res = client.get("/api/v1/maintenance/analytics", headers=headers)
    assert analytics_res.status_code == 200
