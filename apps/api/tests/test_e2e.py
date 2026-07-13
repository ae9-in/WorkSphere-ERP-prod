from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_e2e_tenant_flow():
    # 1. Sign Up
    email = f"admin_{random_string()}@testcompany.com"
    comp_name = f"Test Company {random_string().upper()}"
    signup_payload = {
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Test",
        "lastName": "Admin",
        "fullName": "Test Admin",
        "companyName": comp_name,
        "domain": f"testcorp_{random_string()}.com"
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()
    assert signup_data["success"] is True
    assert "accessToken" in signup_data["data"]
    
    # 2. Login
    login_payload = {
        "email": email,
        "password": "SecurePassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200, login_res.text
    login_data = login_res.json()
    assert login_data["data"]["accessToken"] is not None
    token = login_data["data"]["accessToken"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Department
    # 3. Create Department
    dept_payload = {
        "name": "Engineering Hub",
        "code": f"ENG_{random_string(3).upper()}"
    }
    dept_res = client.post("/api/v1/settings/departments", json=dept_payload, headers=headers)
    assert dept_res.status_code == 200, dept_res.text
    dept_list = dept_res.json()
    assert isinstance(dept_list, list)
    assert any(d["name"] == "Engineering Hub" for d in dept_list)
    
    # 4. Create Designation
    desig_payload = {
        "name": "Senior Staff Architect",
        "code": f"ARC_{random_string(3).upper()}"
    }
    desig_res = client.post("/api/v1/settings/designations", json=desig_payload, headers=headers)
    assert desig_res.status_code == 200, desig_res.text
    desig_list = desig_res.json()
    assert isinstance(desig_list, list)
    assert any(d["name"] == "Senior Staff Architect" for d in desig_list)
    
    # 5. Create Employee via signup/auth or check settings seed defaults
    settings_res = client.post("/api/v1/settings/initialize", json={}, headers=headers)
    assert settings_res.status_code == 200
    assert settings_res.json()["success"] is True
