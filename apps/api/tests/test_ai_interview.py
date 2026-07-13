from fastapi.testclient import TestClient
from app.main import app
import random
import string
from datetime import datetime

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_ai_interview_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Interview Corp {random_string().upper()}",
        "domain": f"interview_{random_string()}.com"
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

    # 5. Create AI Interview Session
    session_res = client.post("/api/ai-interviews", json={
        "candidateId": candidate_id,
        "jobPostingId": job_id
    }, headers=headers)
    assert session_res.status_code == 201, session_res.text
    session_data = session_res.json()["data"]
    session_id = session_data["_id"]
    assert len(session_data["questions"]) == 3
    
    first_q_id = session_data["questions"][0]["_id"]

    # 6. Submit Response
    response_res = client.post(f"/api/ai-interviews/{session_id}/respond", json={
        "questionId": first_q_id,
        "responseText": "I would choose a SQL database like PostgreSQL for structured data requiring ACID transactions, and NoSQL like MongoDB for flexible documents scaling.",
        "durationTaken": 45
    }, headers=headers)
    assert response_res.status_code == 200, response_res.text
    assert response_res.json()["data"]["correctnessScore"] > 0

    # 7. Complete Session
    complete_res = client.post(f"/api/ai-interviews/{session_id}/complete", headers=headers)
    assert complete_res.status_code == 200, complete_res.text
    assert complete_res.json()["data"]["status"] == "completed"
    assert complete_res.json()["data"]["overallScore"] > 0
