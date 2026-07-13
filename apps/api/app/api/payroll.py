from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.payroll import (
    PayrollRunCreateSchema, SalaryStructureCreateSchema,
    PayrollCalendarCreateSchema, PayGroupCreateSchema,
    EmployeeSalaryAssignSchema, PayrollAdjustmentCreateSchema,
    PayrollLoanCreateSchema, PayrollReimbursementCreateSchema
)
from app.services.payroll import PayrollService

router = APIRouter(prefix="/payroll", tags=["payroll"])

@router.get("/runs")
def get_payroll_runs(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.get_runs(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/runs", status_code=201)
def create_payroll_run(payload: PayrollRunCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.create_run(db, payload=payload, tenant_id=tenant_id, author_id=user.id)
    return {
        "success": True,
        "data": result
    }

@router.post("/runs/{id}/process")
def process_payroll_run(id: str, background_tasks: BackgroundTasks, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    PayrollService.process_run(
        db, run_id=id, background_tasks=background_tasks, tenant_id=tenant_id, author_id=user.id
    )
    return {
        "success": True,
        "message": "Payroll processing started"
    }

@router.post("/runs/{id}/recalculate")
def recalculate_payroll_run(id: str, background_tasks: BackgroundTasks, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    PayrollService.recalculate_run(
        db, run_id=id, background_tasks=background_tasks, tenant_id=tenant_id, author_id=user.id
    )
    return {
        "success": True,
        "message": "Payroll recalculation started"
    }

@router.post("/runs/{id}/approve")
def approve_payroll_run(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.approve_run(db, run_id=id, tenant_id=tenant_id, author_id=user.id)
    return {
        "success": True,
        "data": result
    }

@router.post("/runs/{id}/lock")
def lock_payroll_run(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.lock_run(db, run_id=id, tenant_id=tenant_id, author_id=user.id)
    return {
        "success": True,
        "data": result
    }

@router.post("/runs/{id}/reopen")
def reopen_payroll_run(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.reopen_run(db, run_id=id, tenant_id=tenant_id, author_id=user.id)
    return {
        "success": True,
        "data": result
    }

@router.get("/runs/{id}/payslips")
def get_payslips_for_run(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.get_payslips_for_run(db, run_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/payslips/{id}")
def get_payslip(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.get_payslip(db, payslip_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/structures")
def get_salary_structures(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.get_structures(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/structures", status_code=201)
def create_salary_structure(payload: SalaryStructureCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.create_structure(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/salary/assign", status_code=201)
def assign_employee_salary(payload: EmployeeSalaryAssignSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.assign_salary(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

# Reimbursements
@router.post("/reimbursement", status_code=201)
def request_reimbursement(payload: PayrollReimbursementCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    emp_uuid = user.employee_id
    if payload.employeeId and user.role != "employee":
        emp_uuid = uuid.UUID(payload.employeeId)
    result = PayrollService.create_reimbursement(db, payload=payload, employee_id=emp_uuid, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/reimbursement")
def list_reimbursements(employeeId: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    emp_uuid = None
    if user.role == "employee":
        emp_uuid = user.employee_id
    elif employeeId:
        emp_uuid = uuid.UUID(employeeId)
    result = PayrollService.list_reimbursements(db, employee_id=emp_uuid, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/reimbursement/{id}/approve")
def approve_reimbursement(id: str, payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    approve = payload.get("status") == "approved"
    result = PayrollService.approve_reimbursement(db, reimb_id=id, approve=approve, approver_email=user.email, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

# Loans
@router.post("/loans", status_code=201)
def request_loan(payload: PayrollLoanCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.create_loan(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/loans")
def list_loans(employeeId: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    emp_uuid = None
    if user.role == "employee":
        emp_uuid = user.employee_id
    elif employeeId:
        emp_uuid = uuid.UUID(employeeId)
    result = PayrollService.list_loans(db, employee_id=emp_uuid, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/loans/{id}/approve")
def approve_loan(id: str, payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    approve = payload.get("status") == "approved"
    result = PayrollService.approve_loan(db, loan_id=id, approve=approve, approver_email=user.email, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

# Adjustments
@router.post("/adjustment", status_code=201)
def create_adjustment(payload: PayrollAdjustmentCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.create_adjustment(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/adjustment")
def list_adjustments(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.list_adjustments(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

# Ledgers
@router.get("/ledger")
def list_ledgers(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.list_ledgers(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

# Dashboards & Analytics
@router.get("/dashboard")
def get_dashboard(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.get_dashboard(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/analytics")
def get_analytics(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PayrollService.get_analytics(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }
