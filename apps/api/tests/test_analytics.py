from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)


def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def test_analytics_endpoints():
    """
    FR-RPT-001 through FR-RPT-009:
    Verify all 6 new analytics endpoints return 200 with correct response envelope.
    """
    # 1. Sign up as HR admin
    email = f"analytics_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "Analytics",
        "lastName": "Admin",
        "fullName": "Analytics Admin",
        "companyName": f"Analytics Corp {random_string().upper()}",
        "domain": f"analytics_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. FR-RPT-001 — Executive Summary
    exec_res = client.get("/api/reports/executive-summary", headers=headers)
    assert exec_res.status_code == 200, exec_res.text
    exec_data = exec_res.json()["data"]
    assert "totalEmployees" in exec_data
    assert "monthlyPayrollGross" in exec_data
    assert "pendingApprovals" in exec_data
    assert "leaveUtilizationPct" in exec_data
    assert "employeeTypeBreakdown" in exec_data
    assert isinstance(exec_data["employeeTypeBreakdown"], list)

    # 3. FR-RPT-002 — HR Dashboard
    hr_res = client.get("/api/reports/hr-dashboard", headers=headers)
    assert hr_res.status_code == 200, hr_res.text
    hr_data = hr_res.json()["data"]
    assert "upcomingBirthdays" in hr_data
    assert "upcomingAnniversaries" in hr_data
    assert "exits30d" in hr_data
    assert "leavePendingApprovals" in hr_data
    assert isinstance(hr_data["upcomingBirthdays"], list)
    assert isinstance(hr_data["upcomingAnniversaries"], list)

    # 4. FR-RPT-004 — Attendance Trends (6 months)
    trend_res = client.get("/api/reports/attendance-trends", headers=headers)
    assert trend_res.status_code == 200, trend_res.text
    trend_data = trend_res.json()["data"]
    assert isinstance(trend_data, list)
    assert len(trend_data) == 6  # 6 months
    for month_entry in trend_data:
        assert "month" in month_entry
        assert "present" in month_entry
        assert "absent" in month_entry
        assert "leave" in month_entry

    # 5. FR-RPT-006 — Workforce Growth
    growth_res = client.get("/api/reports/workforce-growth", headers=headers)
    assert growth_res.status_code == 200, growth_res.text
    growth_data = growth_res.json()["data"]
    assert isinstance(growth_data, list)
    assert len(growth_data) == 6  # 6 months
    for entry in growth_data:
        assert "month" in entry
        assert "headcount" in entry

    # 6. FR-RPT-009 — Department Statistics
    dept_res = client.get("/api/reports/department-stats", headers=headers)
    assert dept_res.status_code == 200, dept_res.text
    dept_data = dept_res.json()["data"]
    assert isinstance(dept_data, list)
    # Each entry should have the right shape
    for dept in dept_data:
        assert "department" in dept
        assert "headcount" in dept
        assert "avgCTC" in dept
        assert "totalLeaveDays" in dept

    # 7. FR-RPT-005 — Payroll Trends
    pay_res = client.get("/api/reports/payroll-trends", headers=headers)
    assert pay_res.status_code == 200, pay_res.text
    pay_data = pay_res.json()["data"]
    assert isinstance(pay_data, list)
    # Each entry should have right keys if runs exist
    for run in pay_data:
        assert "month" in run
        assert "totalGross" in run
        assert "totalNet" in run

    # 8. Verify legacy endpoints still work
    headcount_res = client.get("/api/reports/headcount?groupBy=department", headers=headers)
    assert headcount_res.status_code == 200, headcount_res.text

    statutory_res = client.get("/api/reports/statutory", headers=headers)
    assert statutory_res.status_code == 200, statutory_res.text
    stat_data = statutory_res.json()["data"]
    assert "pfChallan" in stat_data
    assert "esiChallan" in stat_data
    assert "totalStatutory" in stat_data
