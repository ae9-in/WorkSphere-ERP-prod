from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.models.employee import Employee
from app.models.payroll import PayrollRun

router = APIRouter(prefix="/search", tags=["search"])

@router.get("")
def search(q: str = Query("", min_length=2), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")

    query_str = f"%{q}%"
    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_archived == False,
        (Employee.full_name.ilike(query_str) | Employee.employee_id.ilike(query_str) | Employee.work_email.ilike(query_str))
    ).limit(5).all()

    emp_results = []
    for e in employees:
        emp_results.append({
            "type": "employee",
            "id": str(e.id),
            "title": e.full_name,
            "subtitle": f"{e.designation_name or ''} · {e.employee_id}",
            "badge": e.status,
            "photo": e.photo,
            "url": f"/employees/{e.id}"
        })

    payroll_results = []
    if user.role != "employee":
        runs = db.query(PayrollRun).filter(
            PayrollRun.tenant_id == tenant_id,
            PayrollRun.period.ilike(query_str)
        ).limit(3).all()
        for r in runs:
            payroll_results.append({
                "type": "payroll",
                "id": str(r.id),
                "title": f"{r.period} Payroll Run",
                "subtitle": f"{r.total_employees} employees · ₹{round(r.total_net_pay / 100000.0, 1)}L net",
                "badge": r.status,
                "url": f"/payroll/runs/{r.id}"
            })

    return {
        "success": True,
        "data": {
            "employees": emp_results,
            "payroll": payroll_results,
            "attendance": [],
            "documents": [],
            "total": len(emp_results) + len(payroll_results)
        }
    }
