from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_supply_chain_lifecycle():
    # ── 1. SIGNUP & SETUP TENANT CONTEXT ──
    email = f"scm_mgr_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Supply",
        "lastName": "Chain",
        "fullName": "Supply Chain Manager",
        "companyName": f"Logistics Corp {random_string().upper()}",
        "domain": f"scm_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initialize company settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # ── 2. CREATE INVENTORY MASTER FOR outbound SHIPMENTS ──
    cat_res = client.post("/api/inventory/categories", json={
        "code": "PROD",
        "name": "Finished Products",
        "description": "Outbound shipments stock items"
    }, headers=headers)
    assert cat_res.status_code == 201

    wh_res = client.post("/api/inventory/warehouses", json={
        "code": "WH-MUM",
        "name": "Mumbai Distribution Center",
        "capacity": 10000.0,
        "type": "distribution"
    }, headers=headers)
    assert wh_res.status_code == 201

    client.post("/api/inventory/locations", json={
        "warehouseCode": "WH-MUM",
        "code": "BIN-A",
        "zone": "Zone A"
    }, headers=headers)

    item_res = client.post("/api/inventory/items", json={
        "name": "Enterprise Server Rack Chassis",
        "categoryCode": "PROD",
        "uom": "piece",
        "minStock": 5.0,
        "reorderPoint": 10.0,
        "defaultWarehouseCode": "WH-MUM"
    }, headers=headers)
    assert item_res.status_code == 201
    item_code = item_res.json()["data"]["itemCode"]

    # Initial stock-in = 50.0 units
    stock_res = client.post("/api/inventory/stock-in", json={
        "itemCode": item_code,
        "warehouseCode": "WH-MUM",
        "locationCode": "BIN-A",
        "quantity": 50.0,
        "unitCost": 420.0,
        "remarks": "Outbound shipments inventory buffer intake"
    }, headers=headers)
    assert stock_res.status_code == 201

    # ── 3. REGISTER CARRIERS, VEHICLES, AND DRIVERS ──
    carrier_res = client.post("/api/v1/supply-chain/carriers", json={
        "carrierCode": "DHL-EXP",
        "name": "DHL Express SCM Vendor",
        "carrierType": "3PL"
    }, headers=headers)
    assert carrier_res.status_code == 201

    driver_res = client.post("/api/v1/supply-chain/drivers", json={
        "driverNumber": "DRV-1002",
        "name": "Karan Singh",
        "licenseNumber": "DL-14-2022-882",
        "licenseExpiry": "2030-12-31",
        "certifications": "Hazardous Materials, Heavy Cargo",
        "contactPhone": "+91 99999 88888"
    }, headers=headers)
    assert driver_res.status_code == 201
    driver_id = driver_res.json()["data"]["_id"]

    vehicle_res = client.post("/api/v1/supply-chain/fleet", json={
        "vehicleNumber": "MH-12-PQ-9988",
        "vehicleType": "Container Truck",
        "capacityWeight": 8000.0,
        "capacityVolume": 240.0,
        "fuelType": "Diesel",
        "gpsDeviceId": "GPS-TRK-9988",
        "driverId": driver_id,
        "status": "available",
        "maintenanceStatus": "good"
    }, headers=headers)
    assert vehicle_res.status_code == 201
    vehicle_id = vehicle_res.json()["data"]["_id"]

    # ── 4. PLAN OUTBOUND SHIPMENT ──
    ship_res = client.post("/api/v1/supply-chain/shipments", json={
        "customerName": "Acme Server Solutions Ltd",
        "warehouseCode": "WH-MUM",
        "destinationAddress": "Building 5, HighTech Park, Pune, MH",
        "priority": "high",
        "items": [
            {
                "itemCode": item_code,
                "quantity": 10.0,
                "weight": 25.0,
                "volume": 0.5
            }
        ]
    }, headers=headers)
    assert ship_res.status_code == 201
    shipment_id = ship_res.json()["data"]["_id"]

    # ── 5. OPTIMIZE ROUTE LEG SEQUENCE ──
    route_res = client.post("/api/v1/supply-chain/routes", json={
        "shipmentId": shipment_id,
        "legsSequence": "WH-MUM -> NH-48 Expressway -> PUNE-HUB -> ACME",
        "totalDistance": 142.5,
        "estimatedDuration": 3.8
    }, headers=headers)
    assert route_res.status_code == 200

    # ── 6. DISPATCH GATE PASS & DEDUCT INVENTORY STOCKS ──
    dispatch_res = client.post("/api/v1/supply-chain/dispatch", json={
        "shipmentId": shipment_id,
        "vehicleId": vehicle_id,
        "driverId": driver_id,
        "gatePassNumber": "GATE-MUM-44521"
    }, headers=headers)
    assert dispatch_res.status_code == 200

    # Assert stock count decremented: 50.0 - 10.0 = 40.0 units
    val_res = client.get("/api/inventory/valuation", headers=headers)
    val_item = next(x for x in val_res.json()["data"] if x["itemCode"] == item_code)
    assert val_item["totalQuantity"] == 40.0

    # ── 7. live coordinate TELEMETRY GPS UPDATES ──
    gps_res = client.post("/api/v1/supply-chain/telemetry", json={
        "vehicleId": vehicle_id,
        "shipmentId": shipment_id,
        "latitude": 18.975,
        "longitude": 73.125,
        "speed": 62.5,
        "status": "in_transit"
    }, headers=headers)
    assert gps_res.status_code == 200

    # ── 8. SUBMIT POD & CLOSE OUTBOUND SHIPMENT ──
    pod_res = client.post("/api/v1/supply-chain/pod", json={
        "shipmentId": shipment_id,
        "customerSignerName": "Clerk Amit Patil",
        "otpCode": "889921",
        "remarks": "All server racks received in perfect condition."
    }, headers=headers)
    assert pod_res.status_code == 200

    # Verify vehicle status returns to available
    vehicle_list = client.get("/api/v1/supply-chain/fleet", headers=headers)
    vehicle_record = next(x for x in vehicle_list.json()["data"] if x["_id"] == vehicle_id)
    assert vehicle_record["status"] == "available"

    # ── 9. PROCESS REVERSE RETURN & RESTOCK INVENTORY ──
    # Customer returns 2.0 units due to spec mismatches
    return_res = client.post("/api/v1/supply-chain/reverse", json={
        "originalShipmentId": shipment_id,
        "itemCode": item_code,
        "quantity": 2.0,
        "returnReason": "exchange",
        "inspectionRemarks": "Items in unopened original packaging"
    }, headers=headers)
    assert return_res.status_code == 200

    # Assert inventory incremented back: 40.0 + 2.0 = 42.0 units
    val_res2 = client.get("/api/inventory/valuation", headers=headers)
    val_item2 = next(x for x in val_res2.json()["data"] if x["itemCode"] == item_code)
    assert val_item2["totalQuantity"] == 42.0

    # ── 10. EXECUTIVE ANALYTICS CHECK ──
    dash_res = client.get("/api/v1/supply-chain/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["data"]["shipmentsToday"] == 1
    assert dash_res.json()["data"]["totalFreightCost"] == 600.0
