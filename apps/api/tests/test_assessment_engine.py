from fastapi.testclient import TestClient
from app.main import app
import random
import string
from datetime import datetime

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_assessment_engine_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Assessment Corp {random_string().upper()}",
        "domain": f"assess_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Create Hiring Plan & Requisition to get a valid Job Posting
    plan_res = client.post("/api/v1/recruitment/hiring-plans", json={
        "departmentName": "Engineering",
        "positionTitle": "Senior Backend Engineer",
        "hiringCount": 1,
        "budget": 2500000.0,
        "quarter": "Q3-2026",
        "priority": "high"
    }, headers=headers)
    assert plan_res.status_code == 201

    req_res = client.post("/api/v1/recruitment/requisitions", json={
        "title": "Senior Backend Engineer",
        "departmentName": "Engineering",
        "openPositions": 1,
        "salaryRange": "15-20 LPA",
        "budget": 2500000.0
    }, headers=headers)
    assert req_res.status_code == 201
    req_id = req_res.json()["data"]["id"]

    client.post(f"/api/v1/recruitment/requisitions/{req_id}/approve", json={"status": "approved"}, headers=headers)

    job_res = client.post("/api/v1/recruitment/jobs", json={
        "requisitionId": req_id,
        "title": "Senior Backend Engineer",
        "departmentName": "Engineering",
        "location": "Bangalore",
        "employmentType": "full_time",
        "experienceYears": 5,
        "skills": "python,fastapi",
        "description": "FastAPI engineer role"
    }, headers=headers)
    assert job_res.status_code == 201
    job_id = job_res.json()["data"]["id"]

    # 4. Candidate Application
    apply_res = client.post("/api/v1/recruitment/apply", json={
        "fullName": "Robert Downey",
        "email": f"robert_{random_string()}@marvel.com",
        "phone": "+91 99999 88888",
        "currentCompany": "Stark Industries",
        "currentCtc": 2000000.0,
        "expectedCtc": 2500000.0,
        "noticePeriod": 15,
        "preferredLocation": "Bangalore",
        "jobPostingId": job_id,
        "resumeText": "Experienced python developer with fastapi knowledge"
    }, headers=headers)
    assert apply_res.status_code == 201
    candidate_id = apply_res.json()["data"]["id"]

    # 5. Create Assessment Template
    tpl_res = client.post("/api/assessment-engine/templates", json={
        "title": "FastAPI Coding Challenge",
        "description": "Evaluate basic knowledge of routing and dependency injections.",
        "category": "coding",
        "durationMinutes": 30,
        "passingScore": 50.0,
        "questionsJson": [
            {
                "id": 1,
                "questionText": "What does Depends() accomplish in FastAPI?",
                "options": ["Dependency Injection", "Database Connection", "Background Task"],
                "correctAnswer": "Dependency Injection"
            },
            {
                "id": 2,
                "questionText": "FastAPI stands on top of Starlette and which other library?",
                "options": ["Django", "Pydantic", "Flask"],
                "correctAnswer": "Pydantic"
            }
        ]
    }, headers=headers)
    assert tpl_res.status_code == 201
    tpl_id = tpl_res.json()["data"]["_id"]

    # 6. Start Assessment Attempt
    attempt_res = client.post("/api/assessment-engine/attempts", json={
        "templateId": tpl_id,
        "candidateId": candidate_id
      }, headers=headers)
    assert attempt_res.status_code == 201, attempt_res.text
    attempt_id = attempt_res.json()["data"]["_id"]

    # 7. Submit Attempt Answers
    submit_res = client.post(f"/api/assessment-engine/attempts/{attempt_id}/submit", json={
        "answersJson": {
            "1": "Dependency Injection",
            "2": "Pydantic"
        }
    }, headers=headers)
    assert submit_res.status_code == 200, submit_res.text
    assert submit_res.json()["data"]["score"] == 100.0
    assert submit_res.json()["data"]["status"] == "graded"

    # 8. Verify candidate status has advanced to technical interview in recruitment!
    cand_verify_res = client.get(f"/api/v1/recruitment/candidates/{candidate_id}", headers=headers)
    assert cand_verify_res.status_code == 200
    assert cand_verify_res.json()["data"]["status"] == "technical_interview"
