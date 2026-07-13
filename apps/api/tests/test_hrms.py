from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_hrms_lifecycle():
    # 1. Sign Up to get tenant context and token
    email = f"hr_admin_{random_string()}@testcompany.com"
    comp_name = f"HRMS Test Corp {random_string().upper()}"
    signup_payload = {
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": comp_name,
        "domain": f"testcorp_{random_string()}.com"
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()
    token = signup_data["data"]["accessToken"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Seed settings
    init_res = client.post("/api/v1/settings/initialize", json={}, headers=headers)
    assert init_res.status_code == 200
    
    # 3. Create Employee with nested banking, skills, education, emergency contacts, certifications
    employee_payload = {
        "personal": {
            "firstName": "John",
            "lastName": "Doe",
            "dateOfBirth": "1990-05-15",
            "gender": "male",
            "personalPhone": "+91 99999 88888",
            "personalEmail": "john.doe@gmail.com"
        },
        "official": {
            "workEmail": f"john.doe_{random_string()}@worksphere.com",
            "employeeType": "full_time",
            "dateOfJoining": "2026-07-01",
            "status": "active"
        },
        "job": {
            "departmentName": "Engineering",
            "designationName": "Software Engineer",
            "locationName": "Bengaluru",
            "workMode": "hybrid"
        },
        "salary": {
            "ctc": 1500000.0,
            "basicPercent": 40.0,
            "currency": "INR",
            "paymentMode": "bank_transfer"
        },
        "addressPermanent": {
            "line1": "123 Main St",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "pincode": "560001"
        },
        "education": [
            {
                "degree": "B.Tech",
                "field": "Computer Science",
                "institution": "IIT Bombay",
                "startYear": 2008,
                "endYear": 2012,
                "percentage": 85.5
            }
        ],
        "experience": [
            {
                "company": "Tech Giants Corp",
                "designation": "Junior SWE",
                "startDate": "2012-07-01",
                "endDate": "2015-06-30",
                "isCurrent": False,
                "ctc": 800000.0
            }
        ],
        "emergencyContacts": [
            {
                "name": "Jane Doe",
                "relationship": "Spouse",
                "phone": "+91 88888 77777",
                "isPrimary": True
            }
        ],
        "bank": [
            {
                "bankName": "State Bank of India",
                "accountHolderName": "John Doe",
                "accountNumber": "1234567890",
                "ifscSwiftCode": "SBIN0001234",
                "branchName": "Koramangala Branch",
                "accountType": "savings",
                "isPrimary": True
            }
        ],
        "skills": [
            {
                "skillName": "Python",
                "skillType": "technical",
                "proficiencyLevel": "expert"
            },
            {
                "skillName": "FastAPI",
                "skillType": "technical",
                "proficiencyLevel": "expert"
            }
        ],
        "certifications": [
            {
                "certificationName": "AWS Solutions Architect",
                "issuingAuthority": "Amazon Web Services",
                "issueDate": "2024-01-15"
            }
        ]
    }
    
    create_res = client.post("/api/v1/employees", json=employee_payload, headers=headers)
    assert create_res.status_code == 200, create_res.text
    emp_data = create_res.json()["data"]
    emp_uuid = emp_data["_id"]
    emp_code = emp_data["employeeId"]
    
    # 4. Get Employee and verify serialization
    get_res = client.get(f"/api/v1/employees/{emp_uuid}", headers=headers)
    assert get_res.status_code == 200
    emp_profile = get_res.json()["data"]
    
    assert emp_profile["personal"]["firstName"] == "John"
    assert len(emp_profile["education"]) == 1
    assert emp_profile["education"][0]["degree"] == "B.Tech"
    assert len(emp_profile["experience"]) == 1
    assert emp_profile["experience"][0]["company"] == "Tech Giants Corp"
    assert len(emp_profile["emergencyContacts"]) == 1
    assert emp_profile["emergencyContacts"][0]["relationship"] == "Spouse"
    assert len(emp_profile["bank"]) == 1
    assert emp_profile["bank"][0]["bankName"] == "State Bank of India"
    assert len(emp_profile["skills"]) == 2
    assert any(s["skillName"] == "Python" for s in emp_profile["skills"])
    assert len(emp_profile["certifications"]) == 1
    
    # 5. Verify Timeline has EMPLOYEE_CREATED event
    timeline_res = client.get(f"/api/v1/employees/{emp_uuid}/timeline", headers=headers)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()["data"]
    assert len(timeline) >= 1
    assert any(e["eventType"] == "EMPLOYEE_CREATED" for e in timeline)
    
    # 6. Perform a Promotion action
    promo_payload = {
        "designationName": "Senior Software Engineer",
        "ctc": 1800000.0
    }
    promo_res = client.post(f"/api/v1/employees/{emp_uuid}/promote", json=promo_payload, headers=headers)
    assert promo_res.status_code == 200, promo_res.text
    
    # Verify new details on employee
    get_res = client.get(f"/api/v1/employees/{emp_uuid}", headers=headers)
    emp_profile = get_res.json()["data"]
    assert emp_profile["job"]["designationName"] == "Senior Software Engineer"
    assert emp_profile["salary"]["ctc"] == 1800000.0
    
    # 7. Perform a Transfer action
    transfer_payload = {
        "departmentName": "Product Management"
    }
    transfer_res = client.post(f"/api/v1/employees/{emp_uuid}/transfer", json=transfer_payload, headers=headers)
    assert transfer_res.status_code == 200, transfer_res.text
    
    get_res = client.get(f"/api/v1/employees/{emp_uuid}", headers=headers)
    emp_profile = get_res.json()["data"]
    assert emp_profile["job"]["departmentName"] == "Product Management"
    
    # 8. Upload a document for the employee
    doc_payload = {
        "name": "Offer Letter",
        "category": "offer",
        "employeeId": emp_uuid,
        "size": 512,
        "mimeType": "application/pdf",
        "url": "https://worksphere.com/docs/offer_john.pdf"
    }
    doc_res = client.post(f"/api/v1/employees/{emp_uuid}/documents", json=doc_payload, headers=headers)
    assert doc_res.status_code == 201, doc_res.text
    
    # 9. Verify all timeline events: created, promotion, transfer, document upload
    timeline_res = client.get(f"/api/v1/employees/{emp_uuid}/timeline", headers=headers)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()["data"]
    event_types = [e["eventType"] for e in timeline]
    assert "EMPLOYEE_CREATED" in event_types
    assert "ACTION_PROMOTE" in event_types
    assert "ACTION_TRANSFER" in event_types
    assert "DOCUMENT_UPLOADED" in event_types
