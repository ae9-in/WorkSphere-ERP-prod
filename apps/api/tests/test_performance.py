from fastapi.testclient import TestClient
from app.main import app
import random
import string
from datetime import datetime, timedelta

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_performance_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Perform Corp {random_string().upper()}",
        "domain": f"perform_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()["data"]
    token = signup_data["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get actual employee UUID
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    admin_emp_id = me_res.json()["data"]["employeeId"]

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Create Performance Cycle
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=90)
    cycle_payload = {
        "name": "Q3 2026 Review Cycle",
        "type": "quarterly",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat()
    }
    cycle_res = client.post("/api/performance/cycles", json=cycle_payload, headers=headers)
    assert cycle_res.status_code == 201, cycle_res.text
    cycle_data = cycle_res.json()["data"]
    cycle_id = cycle_data["_id"]

    # 4. Create Employee Goal (OKR)
    goal_payload = {
        "employeeId": admin_emp_id,
        "cycleId": cycle_id,
        "title": "Build WorkSphere ERP Modules",
        "description": "Deliver modular ERP solutions for enterprise clients.",
        "type": "individual",
        "weightage": 1.5,
        "targetValue": 100.0,
        "unit": "percentage",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "keyResults": [
            {
                "title": "Complete Book 13 Onboarding",
                "description": "Fix bug and write test cases",
                "targetValue": 100.0,
                "weightage": 1.0
            },
            {
                "title": "Complete Book 14 Performance",
                "description": "Implement PMS models, services and APIs",
                "targetValue": 100.0,
                "weightage": 1.0
            }
        ]
    }
    goal_res = client.post("/api/performance/goals", json=goal_payload, headers=headers)
    assert goal_res.status_code == 201, goal_res.text
    goal_data = goal_res.json()["data"]
    goal_id = goal_data["_id"]

    # 5. Update Goal Progress
    progress_res = client.patch(f"/api/performance/goals/{goal_id}/progress", json={"currentValue": 50.0}, headers=headers)
    assert progress_res.status_code == 200, progress_res.text
    assert progress_res.json()["data"]["currentValue"] == 50.0

    # 6. Submit Self-Assessment Review
    review_res = client.post("/api/performance/reviews", json={
        "cycleId": cycle_id,
        "selfRating": 4.5,
        "selfComments": "I completed all planned features successfully!"
    }, headers=headers)
    assert review_res.status_code == 201, review_res.text
    review_id = review_res.json()["data"]["_id"]
    assert review_res.json()["data"]["selfRating"] == 4.5

    # 7. Submit Manager Review
    review_mgr_res = client.post("/api/performance/reviews", json={
        "cycleId": cycle_id,
        "managerRating": 4.7,
        "managerComments": "Excellent execution quality and prompt completion."
    }, headers=headers)
    assert review_mgr_res.status_code == 201, review_mgr_res.text
    assert review_mgr_res.json()["data"]["managerRating"] == 4.7

    # 8. Submit Peer / 360 Feedback
    feedback_res = client.post("/api/performance/feedback", json={
        "employeeId": admin_emp_id,
        "cycleId": cycle_id,
        "reviewerId": admin_emp_id,
        "relationship": "peer",
        "rating": 4.8,
        "comments": "Great collaboration skills and architecture design."
    }, headers=headers)
    assert feedback_res.status_code == 201, feedback_res.text

    # 9. Create Performance Improvement Plan (PIP)
    pip_res = client.post("/api/performance/pip", json={
        "employeeId": admin_emp_id,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "expectedOutcomes": "Improve communication channels and delivery frequency."
    }, headers=headers)
    assert pip_res.status_code == 201, pip_res.text

    # 10. Nominate Promotion
    promo_res = client.post("/api/performance/promotions", json={
        "employeeId": admin_emp_id,
        "targetDesignation": "Principal ERP Engineer",
        "proposedCtc": 2400000.0,
        "justification": "Outstanding architect contributions to the organization."
    }, headers=headers)
    assert promo_res.status_code == 201, promo_res.text

    # 11. Award Recognition
    award_res = client.post("/api/performance/recognition", json={
        "employeeId": admin_emp_id,
        "awardType": "spot_award",
        "citation": "Spot award for resolving onboarding and recruitment pipelines."
    }, headers=headers)
    assert award_res.status_code == 201, award_res.text

    # 12. Calibrate Performance Review Rating
    calibrate_res = client.post("/api/performance/calibration", json={
        "reviewId": review_id,
        "calibratedRating": 5.0,
        "calibrationComments": "Calibrated to 5.0 due to exceptional platform design impact."
    }, headers=headers)
    assert calibrate_res.status_code == 200, calibrate_res.text
    assert calibrate_res.json()["data"]["calibratedRating"] == 5.0

    # 13. Create Succession Plan
    succession_res = client.post("/api/performance/succession", json={
        "positionName": "Lead Enterprise Architect",
        "successorId": admin_emp_id,
        "incumbentId": admin_emp_id,
        "readiness": "ready_now",
        "performanceRating": 5.0,
        "potentialRating": 5.0,
        "developmentNeeds": "No critical gaps"
    }, headers=headers)
    assert succession_res.status_code == 201, succession_res.text

    # 14. Get Dashboard Summary, Analytics, and Succession list
    dash_res = client.get("/api/performance/dashboard", headers=headers)
    assert dash_res.status_code == 200, dash_res.text
    assert dash_res.json()["data"]["goalsCount"] > 0

    analytics_res = client.get("/api/performance/analytics", headers=headers)
    assert analytics_res.status_code == 200, analytics_res.text

    succ_list_res = client.get("/api/performance/succession", headers=headers)
    assert succ_list_res.status_code == 200, succ_list_res.text
    assert len(succ_list_res.json()["data"]) > 0
