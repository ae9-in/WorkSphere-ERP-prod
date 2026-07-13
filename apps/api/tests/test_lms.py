from fastapi.testclient import TestClient
from app.main import app
import random
import string
from datetime import datetime

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_lms_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"LMS Corp {random_string().upper()}",
        "domain": f"lms_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve employee UUID
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    admin_emp_id = me_res.json()["data"]["employeeId"]

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Create Course
    course_res = client.post("/api/lms/courses", json={
        "title": "WorkSphere ERP Architecture Masterclass",
        "description": "Thorough walk through backend module design and database conventions.",
        "category": "technical",
        "difficulty": "advanced",
        "durationHours": 10.5
    }, headers=headers)
    assert course_res.status_code == 201, course_res.text
    course_id = course_res.json()["data"]["_id"]

    # 4. Enroll Employee
    enroll_res = client.post("/api/lms/enrollments", json={
        "courseId": course_id,
        "employeeId": admin_emp_id
    }, headers=headers)
    assert enroll_res.status_code == 201, enroll_res.text
    enroll_id = enroll_res.json()["data"]["_id"]

    # 5. Update Progress (50%)
    progress_res = client.patch(f"/api/lms/enrollments/{enroll_id}/progress", json={"progressPercent": 50.0}, headers=headers)
    assert progress_res.status_code == 200, progress_res.text
    assert progress_res.json()["data"]["status"] == "in_progress"

    # 6. Complete Course (100%)
    complete_res = client.patch(f"/api/lms/enrollments/{enroll_id}/progress", json={"progressPercent": 100.0}, headers=headers)
    assert complete_res.status_code == 200, complete_res.text
    assert complete_res.json()["data"]["status"] == "completed"
    assert complete_res.json()["data"]["completedAt"] is not None
