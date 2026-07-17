from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_inventory_operations_lifecycle():
    # 1. Sign up as HR/Admin context to retrieve JWT token and company tenant ID
    email = f"warehouse_mgr_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Warehouse",
        "lastName": "Manager",
        "fullName": "Warehouse Manager",
        "companyName": f"Enterprise Logistics {random_string().upper()}",
        "domain": f"logistics_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initialize company settings context
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 2. Create Category
    cat_res = client.post("/api/inventory/categories", json={
        "code": "RAW",
        "name": "Raw Materials",
        "description": "Base industrial materials"
    }, headers=headers)
    assert cat_res.status_code == 201, cat_res.text
    assert cat_res.json()["data"]["code"] == "RAW"

    # 3. Create Warehouse
    wh_code = f"WH-{random_string(4).upper()}"
    wh_res = client.post("/api/inventory/warehouses", json={
        "code": wh_code,
        "name": "Mumbai Core Hub",
        "address": "Navi Mumbai Terminal 2",
        "capacity": 5000.0,
        "type": "distribution"
    }, headers=headers)
    assert wh_res.status_code == 201, wh_res.text
    assert wh_res.json()["data"]["code"] == wh_code

    # 4. Create Storage Location
    loc_code = "LOC-Z1-A1"
    loc_res = client.post("/api/inventory/locations", json={
        "warehouseCode": wh_code,
        "code": loc_code,
        "zone": "Z1",
        "aisle": "A1"
    }, headers=headers)
    assert loc_res.status_code == 201, loc_res.text
    assert loc_res.json()["data"]["code"] == loc_code

    # 5. Create Inventory Item
    item_name = "Industrial Steel Pipes"
    item_res = client.post("/api/inventory/items", json={
        "name": item_name,
        "brand": "Tata Steel",
        "manufacturer": "Tata",
        "categoryCode": "RAW",
        "uom": "meter",
        "minStock": 10.0,
        "reorderPoint": 25.0,
        "defaultWarehouseCode": wh_code
    }, headers=headers)
    assert item_res.status_code == 201, item_res.text
    item_code = item_res.json()["data"]["itemCode"]
    assert item_code.startswith("ITEM-")

    # 6. Log Stock In transaction (+150 units at cost 250 each)
    stock_in_res = client.post("/api/inventory/stock-in", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 150.0,
        "unitCost": 250.0,
        "remarks": "Initial procurement intake",
        "batchNumber": "BATCH-01",
        "expiryDate": "2029-12-31"
    }, headers=headers)
    assert stock_in_res.status_code == 201, stock_in_res.text
    assert stock_in_res.json()["data"]["quantity"] == 150.0

    # 7. Log Secondary Stock In (+50 units at cost 300 each)
    stock_in_2 = client.post("/api/inventory/stock-in", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 50.0,
        "unitCost": 300.0,
        "remarks": "Secondary intake"
    }, headers=headers)
    assert stock_in_2.status_code == 201

    # 8. Check Valuations (should list current cost valuation metrics)
    val_res = client.get("/api/inventory/valuation?method=FIFO", headers=headers)
    assert val_res.status_code == 200
    val_item = next(x for x in val_res.json()["data"] if x["itemCode"] == item_code)
    assert val_item["totalQuantity"] == 200.0
    # Average cost calculation: ((150*250) + (50*300)) / 200 = 262.5
    assert val_item["averageUnitCost"] == 262.5

    # 9. Perform Stock Out transaction (-60 units)
    stock_out_res = client.post("/api/inventory/stock-out", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 60.0,
        "remarks": "Project allocations checkout"
    }, headers=headers)
    assert stock_out_res.status_code == 201, stock_out_res.text
    # Remaining balance should be 140.0
    assert stock_out_res.json()["data"]["quantity"] == 140.0

    # 10. Perform Stock Out exceeding balance (must fail / prevent negative stock)
    exceed_res = client.post("/api/inventory/stock-out", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 1000.0
    }, headers=headers)
    assert exceed_res.status_code == 400

    # 11. Run cycle counting audit workflow
    count_res = client.post("/api/inventory/count", json={
        "warehouseCode": wh_code,
        "items": [
            {
                "itemCode": item_code,
                "locationCode": loc_code,
                "countedQuantity": 135.0, # Physical audit shows deviation of -5 units
                "remarks": "Slight damage on 5 items"
            }
        ]
    }, headers=headers)
    assert count_res.status_code == 201
    count_id = count_res.json()["data"]["_id"]
    assert count_res.json()["data"]["status"] == "pending"

    # Verify count details shows variance
    details_res = client.get(f"/api/inventory/count/{count_id}", headers=headers)
    assert details_res.status_code == 200
    assert details_res.json()["data"]["items"][0]["variance"] == -5.0

    # Approve cycle count
    approve_res = client.post(f"/api/inventory/count/{count_id}/approve", json={"status": "approved"}, headers=headers)
    assert approve_res.status_code == 200

    # 12. Check Dashboard aggregates and warning alerts
    dash_res = client.get("/api/inventory/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["data"]["totalQuantity"] == 135.0 # Adjusted balance

def test_inventory_upgrades_lifecycle():
    # 1. Sign up to get auth headers
    email = f"upgrade_mgr_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Upgrade",
        "lastName": "Manager",
        "fullName": "Upgrade Manager",
        "companyName": f"Enterprise Warehouse {random_string().upper()}",
        "domain": f"warehouse_{random_string()}.com"
    })
    assert signup_res.status_code == 201
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 2. Create Warehouse
    wh_code = f"WH-{random_string(4).upper()}"
    client.post("/api/inventory/warehouses", json={
        "code": wh_code,
        "name": "Upgraded Warehouse Hub",
        "capacity": 5000.0,
        "type": "distribution"
      }, headers=headers)

    # Create Location
    loc_code = "BIN-A1"
    client.post("/api/inventory/locations", json={
        "warehouseCode": wh_code,
        "code": loc_code,
        "zone": "Z1",
        "aisle": "A1"
    }, headers=headers)

    # 3. Create Item
    item_res = client.post("/api/inventory/items", json={
        "name": "Upgrade Test SKU",
        "brand": "GenBrand",
        "uom": "piece",
        "minStock": 10.0,
        "reorderPoint": 25.0,
        "defaultWarehouseCode": wh_code
    }, headers=headers)
    item_data = item_res.json()["data"]
    item_id = item_data["_id"]
    item_code = item_data["itemCode"]

    # 4. PUT Update item config
    update_res = client.put(f"/api/inventory/items/{item_id}", json={
        "name": "Updated Upgrade Test SKU",
        "safetyStock": 20.0,
        "maxStock": 1000.0
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["name"] == "Updated Upgrade Test SKU"
    assert update_res.json()["data"]["safetyStock"] == 20.0

    # Receive Stock
    client.post("/api/inventory/stock-in", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 100.0,
        "unitCost": 120.0,
        "batchNumber": "B-UPGRADE-01"
    }, headers=headers)

    # 5. Create reservation (reserve 40 units)
    res_res = client.post("/api/inventory/reservations", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 40.0,
        "referenceType": "sales_order",
        "referenceId": "SO-MOCK-999"
    }, headers=headers)
    assert res_res.status_code == 201
    res_id = res_res.json()["data"]["_id"]

    # Try to stock-out 80 units (total 100, 40 reserved, only 60 available - should fail with 400)
    stock_out_res = client.post("/api/inventory/stock-out", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 80.0
    }, headers=headers)
    assert stock_out_res.status_code == 400

    # Cancel reservation
    cancel_res = client.delete(f"/api/inventory/reservations/{res_id}", headers=headers)
    assert cancel_res.status_code == 200

    # Stock-out should now pass
    stock_out_pass = client.post("/api/inventory/stock-out", json={
        "itemCode": item_code,
        "warehouseCode": wh_code,
        "locationCode": loc_code,
        "quantity": 80.0
    }, headers=headers)
    assert stock_out_pass.status_code == 201

    # 6. Quality Inspection (fail 5 units of B-UPGRADE-01 batch)
    qa_res = client.post("/api/inventory/inspections", json={
        "itemCode": item_code,
        "batchNumber": "B-UPGRADE-01",
        "sampleSize": 5,
        "failedQuantity": 5,
        "checklist": {"purity_pass": False},
        "status": "failed",
        "remarks": "Checklist failed purity tests"
    }, headers=headers)
    assert qa_res.status_code == 201
    assert qa_res.json()["data"]["status"] == "failed"

    # 7. Landed Cost Voucher
    lcv_res = client.post("/api/inventory/landed-costs", json={
        "voucherNumber": f"LCV-{random_string(4).upper()}",
        "distributeBy": "quantity",
        "totalExpenses": 1000.0,
        "items": [
            {
                "itemCode": item_code,
                "purchaseReceiptId": "MOCK-RECEIPT-1",
                "receiptQuantity": 10.0,
                "allocatedExpense": 1000.0
            }
        ]
    }, headers=headers)
    assert lcv_res.status_code == 201
    assert len(lcv_res.json()["data"]["items"]) == 1

    # 8. CSV Import
    import_res = client.post("/api/inventory/items/import", json={
        "items": [
            {
                "name": "CSV Item 1",
                "sku": f"CSV-SKU-{random_string(4).upper()}",
                "uom": "piece",
                "minStock": 5.0
            },
            {
                "name": "CSV Item 2",
                "uom": "kg"
            }
        ]
    }, headers=headers)
    assert import_res.status_code == 200
    assert import_res.json()["importedCount"] == 2

