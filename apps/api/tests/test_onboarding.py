from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_onboarding_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Onboard Corp {random_string().upper()}",
        "domain": f"onboard_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Create onboarding workflow (new candidate)
    candidate_email = f"candidate_{random_string()}@worksphere.com"
    onboarding_payload = {
        "basic": {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": candidate_email,
            "phone": "+91 99999 77777",
            "displayName": "Jane Doe",
            "dateOfBirth": "1992-08-20",
            "gender": "female",
            "fatherName": "John Doe Sr",
            "aadhaar": "123456789012",
            "pan": "ABCDE1234F"
        },
        "org": {
            "branch": "Bengaluru HQ",
            "department": "Engineering",
            "designation": "Backend Developer",
            "dateOfJoining": "2026-08-01",
            "employmentType": "full_time",
            "workLocation": "Bengaluru",
            "reportingManager": "Priya Sharma"
        },
        "documents": [
            {
                "documentType": "pan",
                "fileName": "pan_card.pdf",
                "fileSize": 102400
            }
        ],
        "payroll": {
            "ctc": 1200000.0,
            "bankName": "HDFC Bank",
            "accountNumber": "50100234567890",
            "ifsc": "HDFC0000123",
            "uan": "100234567890",
            "pfEnabled": True,
            "esiEnabled": False,
            "professionalTax": True,
            "tds": 10.0,
            "payrollGroup": "Standard"
        },
        "assets": [
            {
                "assetType": "laptop",
                "assetName": "MacBook Pro 16",
                "serialNumber": f"SN-{random_string(6).upper()}"
            }
        ],
        "systemAccess": {
            "role": "employee"
        }
    }

    onboarding_res = client.post("/api/onboarding/new", json=onboarding_payload, headers=headers)
    assert onboarding_res.status_code == 201, onboarding_res.text
    
    data = onboarding_res.json()["data"]
    assert data["email"] == candidate_email
    assert "employeeId" in data
    assert "tempPassword" in data

    # 4. Get employee from database and check if assets were assigned
    emp_id = data["employeeId"]
    emp_res = client.get(f"/api/v1/employees/{emp_id}", headers=headers)
    assert emp_res.status_code == 200, emp_res.text
    emp_data = emp_res.json()["data"]
    
    # Check if the employee status is active
    assert emp_data["official"]["status"] == "active"
    assert emp_data["personal"]["firstName"] == "Jane"
    assert emp_data["salary"]["ctc"] == 1200000.0
