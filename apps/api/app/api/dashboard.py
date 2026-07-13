from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.models.employee import Employee
from app.models.payroll import PayrollRun
from app.models.approval import Approval
from app.models.attendance import Attendance
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/kpis")
def get_kpis(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")

    # Counts
    total_employees = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.is_archived == False).count()
    active_employees = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.is_archived == False, Employee.status == "active").count()
    
    # New joinees this month
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1).strftime("%Y-%m-%d")
    new_joinees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False,
        Employee.date_of_joining >= start_of_month
    ).count()

    # Notices & Leaves
    exiting_this_month = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False,
        Employee.status == "notice_period"
    ).count()

    on_leave_today = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False,
        Employee.status == "on_leave"
    ).count()

    pending_approvals = db.query(Approval).filter(
        Approval.tenant_id == tenant_id,
        Approval.status == "pending"
    ).count()

    # Latest Payroll
    latest_payroll = db.query(PayrollRun).filter(PayrollRun.tenant_id == tenant_id).order_by(PayrollRun.created_at.desc()).first()
    payroll_processed = latest_payroll.status in ["approved", "paid"] if latest_payroll else False
    latest_payroll_amount = latest_payroll.total_net_pay if latest_payroll else 0.0
    latest_payroll_period = latest_payroll.period if latest_payroll else "None"

    # Attendance Rate from most recent attendance date
    latest_att = db.query(Attendance).filter(Attendance.tenant_id == tenant_id).order_by(Attendance.date.desc()).first()
    attendance_rate = 100.0
    if latest_att:
        target_date = latest_att.date
        total_att = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == target_date).count()
        present_att = db.query(Attendance).filter(
            Attendance.tenant_id == tenant_id,
            Attendance.date == target_date,
            Attendance.status.in_(["present", "late", "wfh"])
        ).count()
        if total_att > 0:
            attendance_rate = round((present_att / total_att) * 100, 1)

    # Birthdays next 7 days
    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False,
        Employee.date_of_birth != None,
        Employee.date_of_birth != ""
    ).all()

    upcoming_birthdays = 0
    for emp in employees:
        try:
            # support formats like YYYY-MM-DD
            dob = datetime.strptime(emp.date_of_birth, "%Y-%m-%d")
            bday_this_year = datetime(now.year, dob.month, dob.day)
            diff = (bday_this_year - datetime(now.year, now.month, now.day)).days
            if 0 <= diff <= 7:
                upcoming_birthdays += 1
        except Exception:
            continue

    return {
        "success": True,
        "data": {
            "totalEmployees": total_employees,
            "activeEmployees": active_employees,
            "newJoinees": new_joinees,
            "exitingThisMonth": exiting_this_month,
            "onLeaveToday": on_leave_today,
            "openPositions": 9,
            "payrollProcessed": payroll_processed,
            "latestPayrollAmount": latest_payroll_amount,
            "latestPayrollPeriod": latest_payroll_period,
            "attendanceRate": attendance_rate,
            "pendingApprovals": pending_approvals,
            "upcomingBirthdays": upcoming_birthdays
        }
    }

@router.get("/dept-distribution")
def get_dept_distribution(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    COLORS = {
        "Engineering": "#5B3CF5",
        "Product": "#00C48C",
        "Sales": "#FFB020",
        "Marketing": "#2BB5FF",
        "Finance": "#FF4C8B",
        "Human Resources": "#3D3BF3",
        "Design": "#FF5F57",
        "Operations": "#8E88A8",
    }
    
    query = db.query(Employee.department_name, func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False
    ).group_by(Employee.department_name).all()

    result = []
    for dept_name, count in query:
        name = dept_name or "Others"
        result.append({
            "name": name,
            "value": count,
            "color": COLORS.get(name, "#C4BBFF")
        })
    return {"success": True, "data": result}

@router.get("/headcount-trend")
def get_headcount_trend(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    months = []
    now = datetime.utcnow()
    
    for i in range(11, -1, -1):
        # Go back i months
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
            
        # Get start/end dates of that month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
            
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        label = start_date.strftime("%b %y")

        # Headcount on end date
        count = db.query(Employee).filter(
            Employee.tenant_id == tenant_id,
            Employee.is_archived == False,
            Employee.date_of_joining <= end_str
        ).count()

        # Joiners during this month
        joiners = db.query(Employee).filter(
            Employee.tenant_id == tenant_id,
            Employee.date_of_joining >= start_str,
            Employee.date_of_joining <= end_str
        ).count()

        months.append({
            "month": label,
            "count": count,
            "joiners": joiners,
            "exiters": 0
        })

    return {"success": True, "data": months}

@router.get("/activities")
def get_activities(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    recent_joiners = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False
    ).order_by(Employee.created_at.desc()).limit(5).all()

    activities = []
    for idx, emp in enumerate(recent_joiners):
        # Format time ago
        diff = (datetime.utcnow() - emp.created_at).total_seconds()
        if diff < 3600:
            time_str = f"{int(diff // 60)}m ago"
        elif diff < 86400:
            time_str = f"{int(diff // 3600)}h ago"
        else:
            time_str = f"{int(diff // 86400)}d ago"

        activities.append({
            "id": str(idx + 1),
            "type": "join",
            "actor": emp.full_name,
            "action": f"joined as {emp.designation_name or 'Employee'}",
            "time": time_str,
            "icon": "🎉"
        })
    return {"success": True, "data": activities}

@router.get("/birthdays")
def get_birthdays(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    now = datetime.utcnow()
    
    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False,
        Employee.date_of_birth != None,
        Employee.date_of_birth != ""
    ).all()

    upcoming = []
    for emp in employees:
        try:
            dob = datetime.strptime(emp.date_of_birth, "%Y-%m-%d")
            bday_this_year = datetime(now.year, dob.month, dob.day)
            diff = (bday_this_year - datetime(now.year, now.month, now.day)).days
            
            if 0 <= diff <= 7:
                date_label = "Today" if diff == 0 else bday_this_year.strftime("%d %b")
                upcoming.append({
                    "employeeId": emp.employee_id,
                    "name": emp.full_name,
                    "date": date_label,
                    "dept": emp.department_name or "Unknown"
                })
        except Exception:
            continue
            
    return {"success": True, "data": upcoming}

@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    # Simple payroll calculation
    employees = db.query(Employee.ctc).all()
    total_monthly_payroll = sum((emp.ctc or 0.0) / 12.0 for emp in employees)

    return {
        "success": True,
        "data": {
            "totalEmployees": total_employees,
            "totalMonthlyPayroll": round(total_monthly_payroll),
            "platformUptime": 99.999,
            "complianceJurisdictions": 5 if total_employees > 0 else 1
        }
    }
