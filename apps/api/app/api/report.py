from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.payroll import Payslip, PayrollRun
from app.models.leave import LeaveApplication
from app.models.workflow import WorkflowInstance
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter(prefix="/reports", tags=["reports"])

# ── Legacy endpoints (preserved) ─────────────────────────────

@router.get("/headcount")
def get_headcount_report(groupBy: str = "department", user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    group_col = Employee.department_name
    if groupBy == "location":
        group_col = Employee.location_name
    elif groupBy == "grade":
        group_col = Employee.grade_name

    query = db.query(group_col, func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "active",
        Employee.is_archived == False
    ).group_by(group_col).all()

    report = [{"_id": group_val or "Unassigned", "count": count} for group_val, count in query]
    return {"success": True, "data": report}

@router.get("/attrition")
def get_attrition_report(user: User = Depends(verify_tenant)):
    report = [
        {"month": "Jan", "attritionRate": 1.2},
        {"month": "Feb", "attritionRate": 0.8},
        {"month": "Mar", "attritionRate": 1.5},
        {"month": "Apr", "attritionRate": 1.1},
        {"month": "May", "attritionRate": 0.9},
        {"month": "Jun", "attritionRate": 1.4}
    ]
    return {"success": True, "data": report}

@router.get("/diversity")
def get_diversity_report(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    query = db.query(Employee.gender, func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False
    ).group_by(Employee.gender).all()

    report = [{"_id": gender or "other", "count": count} for gender, count in query]
    return {"success": True, "data": report}

@router.get("/attendance")
def get_monthly_attendance_report(
    month: int = Query(None),
    year: int = Query(None),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    start_date = datetime(y, m, 1).strftime("%Y-%m-%d")
    if m == 12:
        end_date = datetime(y + 1, 1, 1)
    else:
        end_date = datetime(y, m + 1, 1)
    end_str = end_date.strftime("%Y-%m-%d")

    query = db.query(Attendance.status, func.count(Attendance.id)).filter(
        Attendance.tenant_id == tenant_id,
        Attendance.date >= start_date,
        Attendance.date < end_str
    ).group_by(Attendance.status).all()

    report = [{"_id": status, "count": count} for status, count in query]
    return {"success": True, "data": report}

@router.get("/latecomers")
def get_latecomers_report(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    records = db.query(Attendance).filter(
        Attendance.tenant_id == tenant_id,
        Attendance.check_in_time > "09:15"
    ).limit(20).all()

    report = []
    for r in records:
        report.append({
            "id": str(r.id),
            "employeeId": r.employee_id,
            "date": r.date,
            "status": r.status,
            "checkInTime": r.check_in_time,
            "checkOutTime": r.check_out_time
        })
    return {"success": True, "data": report}

@router.get("/payroll-cost")
def get_payroll_cost_report(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    
    # Query payslips and join Employee to group by department_name
    payslips = db.query(Payslip).join(Employee, Employee.id == Payslip.employee_id).filter(
        Payslip.tenant_id == tenant_id
    ).all()

    dept_totals = {}
    for p in payslips:
        dept = p.employee.department_name or "Others"
        totals = p.totals or {}
        gross = float(totals.get("gross", 0.0))
        net = float(totals.get("net", 0.0))
        ded = float(totals.get("deductions", 0.0))
        
        if dept not in dept_totals:
            dept_totals[dept] = {"gross": 0.0, "net": 0.0, "deductions": 0.0}
        
        dept_totals[dept]["gross"] += gross
        dept_totals[dept]["net"] += net
        dept_totals[dept]["deductions"] += ded
        
    report = []
    for dept_name, vals in dept_totals.items():
        report.append({
            "_id": dept_name,
            "totalGross": round(vals["gross"], 2),
            "totalNet": round(vals["net"], 2),
            "totalDeductions": round(vals["deductions"], 2)
        })
    return {"success": True, "data": report}

@router.get("/statutory")
def get_statutory_report(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    payslips = db.query(Payslip).filter(Payslip.tenant_id == tenant_id).all()

    pf_sum = 0.0
    esi_sum = 0.0

    for p in payslips:
        deductions_list = p.deductions or []
        for d in deductions_list:
            if isinstance(d, dict):
                code = d.get("code")
                amount = float(d.get("amount", 0.0))
                if code == "PF":
                    pf_sum += amount
                elif code == "ESI":
                    esi_sum += amount

    return {
        "success": True,
        "data": {
            "pfChallan": pf_sum,
            "esiChallan": esi_sum,
            "totalStatutory": pf_sum + esi_sum
        }
    }

@router.get("/leave-summary")
def get_leave_summary_report(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    query = db.query(LeaveApplication.leave_type_id, func.sum(LeaveApplication.days)).filter(
        LeaveApplication.tenant_id == tenant_id,
        LeaveApplication.status == "approved"
    ).group_by(LeaveApplication.leave_type_id).all()

    report = [{"_id": str(lt_id), "totalDays": days} for lt_id, days in query]
    return {"success": True, "data": report}

@router.post("/custom")
def run_custom_report(payload: Dict[str, Any], user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    entity = payload.get("entity")
    columns = payload.get("columns", [])
    filters = payload.get("filters", [])

    model = Employee
    if entity == "payslip":
        model = Payslip
    elif entity == "attendance":
        model = Attendance
    elif entity == "leave":
        model = LeaveApplication

    query = db.query(model).filter(model.tenant_id == tenant_id)

    for f in filters:
        field = f.get("field")
        val = f.get("value")
        op = f.get("operator", "eq")

        if hasattr(model, field) and val is not None:
            attr = getattr(model, field)
            if op == "eq":
                query = query.filter(attr == val)
            elif op == "like":
                query = query.filter(attr.ilike(f"%{val}%"))

    records = query.limit(50).all()

    formatted = []
    for r in records:
        row = {}
        for col in columns:
            if hasattr(r, col):
                val = getattr(r, col)
                if hasattr(val, "hex"):
                    val = str(val)
                elif isinstance(val, datetime):
                    val = val.isoformat()
                row[col] = val
        if not row:
            row = {c.name: str(getattr(r, c.name)) for c in model.__table__.columns}
        formatted.append(row)

    return {"success": True, "data": formatted}


# ── New Analytics Endpoints (Module 13 — Reporting & Analytics) ───────

@router.get("/executive-summary")
def get_executive_summary(
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    FR-RPT-001 — Executive Dashboard KPIs:
    Total Employees, Total Monthly Payroll Gross, Leave Utilization Rate,
    Pending Workflow Approvals.
    """
    tenant_id = user.company_id

    # Total active employees
    total_employees = db.query(func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "active",
        Employee.is_archived == False
    ).scalar() or 0

    # New joiners in last 30 days
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    new_joiners_30d = db.query(func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.date_of_joining >= thirty_days_ago,
        Employee.is_archived == False
    ).scalar() or 0

    # Total monthly payroll gross (most recent completed payroll run)
    latest_run = db.query(PayrollRun).filter(
        PayrollRun.tenant_id == tenant_id,
        PayrollRun.status.in_(["completed", "approved", "paid"])
    ).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).first()
    monthly_payroll_gross = latest_run.total_gross if latest_run else 0.0
    monthly_payroll_net = latest_run.total_net_pay if latest_run else 0.0

    # Pending workflow approvals across the tenant
    pending_approvals = db.query(func.count(WorkflowInstance.id)).filter(
        WorkflowInstance.tenant_id == tenant_id,
        WorkflowInstance.status == "pending"
    ).scalar() or 0

    # Leave utilization rate: approved leaves this month / total employees
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1).strftime("%Y-%m-%d")
    approved_leaves_this_month = db.query(func.count(LeaveApplication.id)).filter(
        LeaveApplication.tenant_id == tenant_id,
        LeaveApplication.status == "approved",
        LeaveApplication.from_date >= month_start
    ).scalar() or 0
    leave_utilization_pct = round((approved_leaves_this_month / max(total_employees, 1)) * 100, 1)

    # Headcount by employment type
    by_type = db.query(Employee.employee_type, func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False
    ).group_by(Employee.employee_type).all()
    employee_type_breakdown = [{"type": t or "other", "count": c} for t, c in by_type]

    return {
        "success": True,
        "data": {
            "totalEmployees": total_employees,
            "newJoiners30d": new_joiners_30d,
            "monthlyPayrollGross": monthly_payroll_gross,
            "monthlyPayrollNet": monthly_payroll_net,
            "pendingApprovals": pending_approvals,
            "leaveUtilizationPct": leave_utilization_pct,
            "employeeTypeBreakdown": employee_type_breakdown,
        }
    }


@router.get("/hr-dashboard")
def get_hr_dashboard(
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    FR-RPT-002 — HR Dashboard:
    Upcoming birthdays (7d), upcoming work anniversaries (7d),
    exits in last 30 days, leave pending approvals.
    """
    tenant_id = user.company_id
    today = datetime.utcnow().date()

    # Upcoming birthdays (next 7 days) — compare MM-DD string
    today_md = today.strftime("%m-%d")
    week_md = (today + timedelta(days=7)).strftime("%m-%d")
    all_employees = db.query(
        Employee.full_name,
        Employee.employee_id,
        Employee.date_of_birth,
        Employee.department_name
    ).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "active",
        Employee.date_of_birth != None,
        Employee.is_archived == False
    ).all()

    upcoming_birthdays = []
    upcoming_anniversaries = []
    for emp in all_employees:
        if emp.date_of_birth:
            try:
                dob_md = emp.date_of_birth[5:10]  # MM-DD from YYYY-MM-DD
                if today_md <= dob_md <= week_md:
                    upcoming_birthdays.append({
                        "name": emp.full_name,
                        "employeeId": emp.employee_id,
                        "date": emp.date_of_birth,
                        "department": emp.department_name
                    })
            except Exception:
                pass

    all_for_anniversary = db.query(
        Employee.full_name,
        Employee.employee_id,
        Employee.date_of_joining,
        Employee.department_name
    ).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "active",
        Employee.date_of_joining != None,
        Employee.is_archived == False
    ).all()

    for emp in all_for_anniversary:
        if emp.date_of_joining:
            try:
                doj_md = emp.date_of_joining[5:10]  # MM-DD
                if today_md <= doj_md <= week_md:
                    upcoming_anniversaries.append({
                        "name": emp.full_name,
                        "employeeId": emp.employee_id,
                        "date": emp.date_of_joining,
                        "department": emp.department_name
                    })
            except Exception:
                pass

    # Exits / offboarded in last 30 days
    thirty_days_ago = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    exits_30d = db.query(func.count(Employee.id)).filter(
        Employee.tenant_id == tenant_id,
        Employee.status.in_(["resigned", "terminated"]),
        Employee.exit_date >= thirty_days_ago
    ).scalar() or 0

    # Leave pending approvals count
    leave_pending = db.query(func.count(LeaveApplication.id)).filter(
        LeaveApplication.tenant_id == tenant_id,
        LeaveApplication.status == "pending"
    ).scalar() or 0

    return {
        "success": True,
        "data": {
            "upcomingBirthdays": upcoming_birthdays,
            "upcomingAnniversaries": upcoming_anniversaries,
            "exits30d": exits_30d,
            "leavePendingApprovals": leave_pending,
        }
    }


@router.get("/attendance-trends")
def get_attendance_trends(
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    FR-RPT-004 — Attendance Dashboard:
    6-month monthly breakdown of attendance statuses (present, absent, leave, half_day).
    """
    tenant_id = user.company_id
    now = datetime.utcnow()

    # Build 6-month range
    months = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        months.append((y, m))

    MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    trends = []
    for (y, m) in months:
        month_start = f"{y:04d}-{m:02d}-01"
        if m == 12:
            next_y, next_m = y + 1, 1
        else:
            next_y, next_m = y, m + 1
        month_end = f"{next_y:04d}-{next_m:02d}-01"

        rows = db.query(Attendance.status, func.count(Attendance.id)).filter(
            Attendance.tenant_id == tenant_id,
            Attendance.date >= month_start,
            Attendance.date < month_end
        ).group_by(Attendance.status).all()

        row_dict = {r.status: count for r, count in rows}
        # Flatten from query result tuples correctly
        status_dict: Dict[str, int] = {}
        for row_status, count in rows:
            status_dict[row_status] = count

        trends.append({
            "month": MONTH_LABELS[m - 1],
            "year": y,
            "present": status_dict.get("present", 0),
            "absent": status_dict.get("absent", 0),
            "leave": status_dict.get("leave", 0),
            "halfDay": status_dict.get("half_day", 0),
            "wfh": status_dict.get("wfh", 0),
        })

    return {"success": True, "data": trends}


@router.get("/workforce-growth")
def get_workforce_growth(
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    FR-RPT-006 — Workforce Growth:
    Month-over-month cumulative active employee count for the last 6 months.
    """
    tenant_id = user.company_id
    now = datetime.utcnow()

    MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    months = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        months.append((y, m))

    growth = []
    for (y, m) in months:
        # Count employees who joined on or before this month end and are still active
        if m == 12:
            end_date = f"{y + 1:04d}-01-01"
        else:
            end_date = f"{y:04d}-{m + 1:02d}-01"

        count = db.query(func.count(Employee.id)).filter(
            Employee.tenant_id == tenant_id,
            Employee.date_of_joining < end_date,
            Employee.is_archived == False,
            Employee.status.in_(["active", "on_leave", "notice_period"])
        ).scalar() or 0

        growth.append({
            "month": MONTH_LABELS[m - 1],
            "year": y,
            "headcount": count
        })

    return {"success": True, "data": growth}


@router.get("/department-stats")
def get_department_stats(
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    FR-RPT-009 — Department Statistics:
    Per-department: employee count, average CTC, total approved leave days.
    """
    tenant_id = user.company_id

    # Headcount and avg CTC by department
    dept_query = db.query(
        Employee.department_name,
        func.count(Employee.id).label("headcount"),
        func.avg(Employee.ctc).label("avg_ctc")
    ).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "active",
        Employee.is_archived == False
    ).group_by(Employee.department_name).all()

    # Leave days per department (via employee join)
    leave_query = db.query(
        Employee.department_name,
        func.coalesce(func.sum(LeaveApplication.days), 0).label("total_leave_days")
    ).join(
        LeaveApplication,
        and_(
            LeaveApplication.employee_id == Employee.id,
            LeaveApplication.tenant_id == tenant_id,
            LeaveApplication.status == "approved"
        ),
        isouter=True
    ).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "active",
        Employee.is_archived == False
    ).group_by(Employee.department_name).all()

    leave_map: Dict[str, float] = {dept: (days or 0) for dept, days in leave_query}

    stats = []
    for dept_name, headcount, avg_ctc in dept_query:
        stats.append({
            "department": dept_name or "Unassigned",
            "headcount": headcount,
            "avgCTC": round(float(avg_ctc or 0), 2),
            "totalLeaveDays": float(leave_map.get(dept_name, 0))
        })

    return {"success": True, "data": stats}


@router.get("/payroll-trends")
def get_payroll_trends(
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    FR-RPT-005 / FR-RPT-007 — Payroll & Leave Trends:
    Monthly gross payroll totals for the last 6 completed payroll runs.
    """
    tenant_id = user.company_id
    MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Query last 6 completed payroll runs ordered by year/month desc
    runs = db.query(PayrollRun).filter(
        PayrollRun.tenant_id == tenant_id,
        PayrollRun.status.in_(["completed", "approved", "paid"])
    ).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).limit(6).all()

    # Reverse to chronological order
    runs = list(reversed(runs))

    trends = []
    for run in runs:
        trends.append({
            "month": MONTH_LABELS[run.month - 1],
            "year": run.year,
            "period": run.period,
            "totalGross": run.total_gross,
            "totalNet": run.total_net_pay,
            "totalDeductions": run.total_deductions,
            "totalEmployees": run.total_employees,
        })

    return {"success": True, "data": trends}
