from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_helpdesk_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Helpdesk Corp {random_string().upper()}",
        "domain": f"helpdesk_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get employee id
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    admin_emp_id = me_res.json()["data"]["employeeId"]

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Submit a Support Ticket
    ticket_res = client.post("/api/helpdesk/tickets", json={
        "title": "Payslip for June not generated",
        "description": "The June 2026 payslip is missing in the portal. Please investigate.",
        "category": "payroll",
        "priority": "high"
    }, headers=headers)
    assert ticket_res.status_code == 201, ticket_res.text
    ticket_id = ticket_res.json()["data"]["_id"]
    assert ticket_res.json()["data"]["status"] == "open"

    # 4. Assign Ticket to Agent (self-assignment for test)
    assign_res = client.post(f"/api/helpdesk/tickets/{ticket_id}/assign", json={
        "assignedToId": admin_emp_id
    }, headers=headers)
    assert assign_res.status_code == 200, assign_res.text
    assert assign_res.json()["data"]["status"] == "in_progress"

    # 5. Add a Comment Response
    comment_res = client.post(f"/api/helpdesk/tickets/{ticket_id}/comments", json={
        "content": "Investigating payroll engine run logs. Will update shortly."
    }, headers=headers)
    assert comment_res.status_code == 200, comment_res.text
    assert len(comment_res.json()["data"]["comments"]) == 1

    # 6. Resolve the Ticket
    resolve_res = client.patch(f"/api/helpdesk/tickets/{ticket_id}/status", json={
        "status": "resolved"
    }, headers=headers)
    assert resolve_res.status_code == 200, resolve_res.text
    assert resolve_res.json()["data"]["status"] == "resolved"

    # 7. List all tickets and verify it appears
    list_res = client.get("/api/helpdesk/tickets", headers=headers)
    assert list_res.status_code == 200
    assert any(t["_id"] == ticket_id for t in list_res.json()["data"])
