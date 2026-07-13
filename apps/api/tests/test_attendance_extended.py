from fastapi.testclient import TestClient
from app.main import app
import random
import string
import uuid
from datetime import datetime

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_attendance_extended_lifecycle():
    # 1. Sign Up to get tenant context and token
    email = f"hr_admin_{random_string()}@testcompany.com"
    comp_name = f"Attendance Corp {random_string().upper()}"
    signup_payload = {
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": comp_name,
        "domain": f"attend_corp_{random_string()}.com"
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()
    token = signup_data["data"]["accessToken"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Seed settings
    init_res = client.post("/api/v1/settings/initialize", json={}, headers=headers)
    assert init_res.status_code == 200
    
    # 3. Create Employee
    employee_payload = {
        "personal": {
            "firstName": "Alex",
            "lastName": "Hunter",
            "dateOfBirth": "1994-08-20",
            "gender": "male",
            "personalPhone": "+91 99999 77777",
            "personalEmail": "alex.hunter@gmail.com"
        },
        "official": {
            "workEmail": f"alex.hunter_{random_string()}@worksphere.com",
            "employeeType": "full_time",
            "dateOfJoining": "2026-07-01",
            "status": "active"
        },
        "job": {
            "departmentName": "Engineering",
            "designationName": "QA Engineer",
            "locationName": "Headquarters",
            "workMode": "onsite"
        },
        "salary": {
            "ctc": 1200000.0,
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
    
    # 4. Create Shift
    shift_payload = {
        "name": "General Day Shift",
        "code": f"SHIFT_{random_string().upper()}",
        "startTime": "09:00",
        "endTime": "18:00",
        "breakDuration": 60,
        "gracePeriod": 15,
        "minWorkingHours": 8.0,
        "isActive": True
    }
    shift_res = client.post("/api/v1/attendance/shifts", json=shift_payload, headers=headers)
    assert shift_res.status_code == 200, shift_res.text
    shift_id = shift_res.json()["data"]["id"]
    
    # List shifts
    list_shifts_res = client.get("/api/v1/attendance/shifts", headers=headers)
    assert list_shifts_res.status_code == 200
    assert len(list_shifts_res.json()["data"]) >= 1

    # 5. Assign Shift to Employee
    assign_payload = {
        "employeeId": emp_uuid,
        "shiftId": shift_id,
        "effectiveDate": "2026-07-01"
    }
    assign_res = client.post("/api/v1/attendance/shifts/assign", json=assign_payload, headers=headers)
    assert assign_res.status_code == 200, assign_res.text
    
    # 6. Check In (with GPS coords inside Bengaluru HQ geofence)
    # Note: Settings init seeds Bengaluru with lat=12.9716, lng=77.5946
    checkin_payload = {
        "employeeId": emp_uuid,
        "workMode": "onsite",
        "lat": 12.9716,
        "lng": 77.5946
    }
    checkin_res = client.post("/api/v1/attendance/checkin", json=checkin_payload, headers=headers)
    assert checkin_res.status_code == 200, checkin_res.text
    record = checkin_res.json()["data"]
    record_id = record["_id"]
    assert record["geofenceStatus"] == "inside"
    assert record["shift"]["id"] == shift_id
    
    # 7. Log Break session
    break_start_payload = {
        "employeeId": emp_uuid,
        "date": record["date"],
        "breakType": "lunch"
    }
    break_start_res = client.post("/api/v1/attendance/breaks/start", json=break_start_payload, headers=headers)
    assert break_start_res.status_code == 200, break_start_res.text
    
    break_end_payload = {
        "employeeId": emp_uuid,
        "date": record["date"]
    }
    break_end_res = client.post("/api/v1/attendance/breaks/end", json=break_end_payload, headers=headers)
    assert break_end_res.status_code == 200, break_end_res.text
    
    # 8. Check Out
    checkout_res = client.patch(f"/api/v1/attendance/{record_id}/checkout", headers=headers)
    assert checkout_res.status_code == 200, checkout_res.text
    checkout_record = checkout_res.json()["data"]
    assert checkout_record["checkOut"] is not None
    assert len(checkout_record["breaks"]) == 1
    
    # 9. Request Regularization for a missed punch day
    past_date = "2026-07-09"
    reg_payload = {
        "employeeId": emp_uuid,
        "date": past_date,
        "requestType": "missed_punch",
        "checkIn": "09:00:00",
        "checkOut": "18:00:00",
        "reason": "Forgot access card"
    }
    reg_res = client.post("/api/v1/attendance/regularization", json=reg_payload, headers=headers)
    assert reg_res.status_code == 200, reg_res.text
    
    # List regularizations
    list_regs_res = client.get("/api/v1/attendance/regularization", headers=headers)
    assert list_regs_res.status_code == 200
    regs = list_regs_res.json()["data"]
    assert len(regs) >= 1
    pending_reg = [r for r in regs if r["date"] == past_date][0]
    reg_id = pending_reg["id"]
    
    # 10. Approve Regularization
    approve_payload = {
        "status": "approved",
        "comments": "Approved after manual sign sheet cross check"
    }
    approve_res = client.post(f"/api/v1/attendance/regularization/{reg_id}/approve", json=approve_payload, headers=headers)
    assert approve_res.status_code == 200, approve_res.text
    
    # Verify record was regularized
    list_res = client.get(f"/api/v1/attendance?date={past_date}", headers=headers)
    assert list_res.status_code == 200
    records = list_res.json()["data"]["records"]
    matched = [r for r in records if r["employeeId"] == emp_data["employeeId"]][0]
    assert matched["checkIn"] == "09:00:00"
    assert matched["checkOut"] == "18:00:00"
    assert matched["status"] == "present"
    
    # 11. Lock attendance period
    lock_payload = {
        "startDate": "2026-07-01",
        "endDate": "2026-07-10"
    }
    lock_res = client.post("/api/v1/attendance/lock", json=lock_payload, headers=headers)
    assert lock_res.status_code == 200, lock_res.text
    assert lock_res.json()["data"]["lockedCount"] >= 2
    
    # Try check-out on locked record, should fail
    checkout_fail = client.patch(f"/api/v1/attendance/{record_id}/checkout", headers=headers)
    assert checkout_fail.status_code == 400
    assert "locked" in checkout_fail.json()["detail"]

    # 12. Retrieve Analytics
    analytics_res = client.get("/api/v1/attendance/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()["data"]
    assert "averageWorkingHours" in analytics_data
    assert "punctualityRate" in analytics_data
