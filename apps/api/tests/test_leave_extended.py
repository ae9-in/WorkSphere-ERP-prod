from fastapi.testclient import TestClient
from app.main import app
import random
import string
import uuid
from datetime import datetime

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_leave_extended_lifecycle():
    # 1. Sign Up to get tenant context and token
    email = f"hr_admin_{random_string()}@testcompany.com"
    comp_name = f"Leave Corp {random_string().upper()}"
    signup_payload = {
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": comp_name,
        "domain": f"leave_corp_{random_string()}.com"
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()
    token = signup_data["data"]["accessToken"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Seed settings (seeds leave types: AL, SL, CL, ML, PL, LOP)
    init_res = client.post("/api/v1/settings/initialize", json={}, headers=headers)
    assert init_res.status_code == 200
    
    # 3. Create Employee
    employee_payload = {
        "personal": {
            "firstName": "Sara",
            "lastName": "Conor",
            "dateOfBirth": "1992-04-12",
            "gender": "female",
            "personalPhone": "+91 99999 55555",
            "personalEmail": "sara.conor@gmail.com"
        },
        "official": {
            "workEmail": f"sara.conor_{random_string()}@worksphere.com",
            "employeeType": "full_time",
            "dateOfJoining": "2026-07-01",
            "status": "active"
        },
        "job": {
            "departmentName": "Operations",
            "designationName": "HR Manager",
            "locationName": "Headquarters",
            "workMode": "onsite"
        },
        "salary": {
            "ctc": 1000000.0,
            "basicPercent": 40.0,
            "currency": "INR",
            "paymentMode": "bank_transfer",
            "effectiveDate": "2026-07-01"
        }
    }
    create_res = client.post("/api/v1/employees", json=employee_payload, headers=headers)
    assert create_res.status_code == 200, create_res.text
    emp_data = create_res.json()["data"]
    emp_uuid = emp_data["_id"]
    
    # 4. List Leave Types
    types_res = client.get("/api/v1/leave/types", headers=headers)
    assert types_res.status_code == 200
    types = types_res.json()["data"]
    assert len(types) >= 1
    
    # Find Casual Leave (CL)
    cl_type = [t for t in types if t["code"] == "CL"][0]
    cl_type_id = cl_type["id"]
    
    # 5. Fetch Initial Balances
    bal_res = client.get(f"/api/v1/leave/balances?employeeId={emp_uuid}", headers=headers)
    assert bal_res.status_code == 200
    balances = bal_res.json()["data"]
    cl_balance = [b for b in balances if b["leaveTypeId"]["code"] == "CL"][0]
    assert cl_balance["available"] == 7.0 # Seed CL = 7.0 days max
    
    # 6. Apply Leave (2 days mid-week to avoid automatic weekends subtraction conflicts)
    # Note: 2026-07-15 is Wednesday, 2026-07-16 is Thursday. Net working days = 2.0
    apply_payload = {
        "employeeId": emp_uuid,
        "leaveTypeId": cl_type_id,
        "from_date": "2026-07-15",
        "to_date": "2026-07-16",
        "reason": "Family gathering",
        "halfDay": False
    }
    apply_res = client.post("/api/v1/leave/apply", json=apply_payload, headers=headers)
    assert apply_res.status_code == 201, apply_res.text
    app_data = apply_res.json()["data"]
    app_id = app_data["_id"]
    assert app_data["status"] == "pending"
    assert app_data["days"] == 2.0
    
    # Verify balance reserved (available decreases, pending increases)
    bal_res = client.get(f"/api/v1/leave/balances?employeeId={emp_uuid}", headers=headers)
    cl_balance = [b for b in bal_res.json()["data"] if b["leaveTypeId"]["code"] == "CL"][0]
    assert cl_balance["available"] == 5.0
    assert cl_balance["pending"] == 2.0
    
    # 7. Approve Leave Application
    action_payload = {
        "comments": "Approved. Enjoy your gathering."
    }
    approve_res = client.post(f"/api/v1/leave/applications/{app_id}/approve", json=action_payload, headers=headers)
    assert approve_res.status_code == 200, approve_res.text
    assert approve_res.json()["data"]["status"] == "approved"
    
    # Verify balance updated (used increases, pending decreases)
    bal_res = client.get(f"/api/v1/leave/balances?employeeId={emp_uuid}", headers=headers)
    cl_balance = [b for b in bal_res.json()["data"] if b["leaveTypeId"]["code"] == "CL"][0]
    assert cl_balance["used"] == 2.0
    assert cl_balance["pending"] == 0.0
    
    # Verify attendance updated to status "leave" and hours 0.0
    att_res = client.get(f"/api/v1/attendance?date=2026-07-15", headers=headers)
    assert att_res.status_code == 200
    att_records = att_res.json()["data"]["records"]
    matched_att = [r for r in att_records if r["employeeId"] == emp_data["employeeId"]][0]
    assert matched_att["status"] == "leave"
    assert matched_att["workingHours"] == 0.0
    
    # 8. Cancel Approved Leave Application
    cancel_payload = {
        "comments": "Gathering cancelled, returning to office."
    }
    cancel_res = client.post("/api/v1/leave/cancel", json={"applicationId": app_id, "comments": "Returning to work"}, headers=headers)
    assert cancel_res.status_code == 200, cancel_res.text
    assert cancel_res.json()["data"]["status"] == "cancelled"
    
    # Verify balance refunded
    bal_res = client.get(f"/api/v1/leave/balances?employeeId={emp_uuid}", headers=headers)
    cl_balance = [b for b in bal_res.json()["data"] if b["leaveTypeId"]["code"] == "CL"][0]
    assert cl_balance["used"] == 0.0
    assert cl_balance["available"] == 7.0
    
    # Verify attendance record auto-sync restored (attendance record deleted/restored)
    att_res = client.get(f"/api/v1/attendance?date=2026-07-15", headers=headers)
    assert att_res.status_code == 200
    att_records = att_res.json()["data"]["records"]
    matched_att_list = [r for r in att_records if r["employeeId"] == emp_data["employeeId"]]
    assert len(matched_att_list) == 0
    
    # 9. Request Leave Encashment
    encash_payload = {
        "employeeId": emp_uuid,
        "leaveTypeId": cl_type_id,
        "days": 3.0,
        "reason": "Year end cashout"
    }
    encash_res = client.post("/api/v1/leave/encashment", json=encash_payload, headers=headers)
    assert encash_res.status_code == 200, encash_res.text
    enc_id = encash_res.json()["data"]["id"]
    
    # List encashments
    list_enc_res = client.get("/api/v1/leave/encashment", headers=headers)
    assert list_enc_res.status_code == 200
    assert len(list_enc_res.json()["data"]) >= 1
    
    # Approve Encashment
    approve_enc_res = client.post(f"/api/v1/leave/encashment/{enc_id}/approve", json={"status": "approved", "comments": "Approved payout"}, headers=headers)
    assert approve_enc_res.status_code == 200, approve_enc_res.text
    
    # Verify balance decreased
    bal_res = client.get(f"/api/v1/leave/balances?employeeId={emp_uuid}", headers=headers)
    cl_balance = [b for b in bal_res.json()["data"] if b["leaveTypeId"]["code"] == "CL"][0]
    assert cl_balance["available"] == 4.0
    
    # 10. Run Accrual
    # Create an accrual based leave type
    new_type_payload = {
        "name": "Sick Leave Accrual",
        "code": "SLA",
        "is_paid": True,
        "accrual_based": True,
        "max_days": 12,
        "carry_forward": True,
        "requires_approval": True
    }
    create_type_res = client.post("/api/v1/leave/types", json=new_type_payload, headers=headers)
    assert create_type_res.status_code == 201
    sla_type_id = create_type_res.json()["data"]["id"]

    accrual_payload = {
        "employeeId": emp_uuid,
        "leaveTypeId": sla_type_id
    }
    accrual_res = client.post("/api/v1/leave/accrual", json=accrual_payload, headers=headers)
    assert accrual_res.status_code == 200, accrual_res.text
    assert accrual_res.json()["data"]["accruedCount"] == 1
    
    # Verify balance accrued (12 / 12.0 = 1.0 day accrued)
    bal_res = client.get(f"/api/v1/leave/balances?employeeId={emp_uuid}", headers=headers)
    sla_balance = [b for b in bal_res.json()["data"] if b["leaveTypeId"]["code"] == "SLA"][0]
    assert sla_balance["available"] == 1.0
    
    # 11. Carry Forward
    cf_payload = {
        "sourceYear": 2026,
        "targetYear": 2027
    }
    cf_res = client.post("/api/v1/leave/carry-forward", json=cf_payload, headers=headers)
    assert cf_res.status_code == 200, cf_res.text
    
    # 12. Get Ledgers
    ledger_res = client.get(f"/api/v1/leave/ledger?employeeId={emp_uuid}", headers=headers)
    assert ledger_res.status_code == 200
    ledger_data = ledger_res.json()["data"]
    assert len(ledger_data) >= 1
    
    # 13. Get Dashboard & Analytics
    dash_res = client.get("/api/v1/leave/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert "pendingCount" in dash_res.json()["data"]
    
    analytics_res = client.get("/api/v1/leave/analytics", headers=headers)
    assert analytics_res.status_code == 200
    assert "averageLeaveDuration" in analytics_res.json()["data"]
