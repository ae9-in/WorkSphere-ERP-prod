from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.project import (
    ProjectCreateSchema, TaskCreateSchema, TaskStatusUpdateSchema,
    TimesheetCreateSchema, TimesheetApproveSchema, MilestoneCreateSchema, RiskCreateSchema
)
from app.services.project import ProjectService

router = APIRouter(prefix="/project", tags=["project"])

# Dashboard Endpoint
@router.get("/dashboard")
def get_dashboard(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.get_dashboard_summary(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Project CRUD
@router.post("/projects", status_code=201)
def create_project(payload: ProjectCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.create_project(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/projects")
def get_projects(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.list_projects(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/projects/{id}")
def get_project_details(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.get_project(db, project_id=id, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Task CRUD
@router.post("/tasks", status_code=201)
def create_task(payload: TaskCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.create_task(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/tasks")
def get_tasks(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.list_tasks(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.patch("/tasks/{id}/status")
def update_task_status(id: str, payload: TaskStatusUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.update_task_status(db, task_id=id, status=payload.status, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Timesheet CRUD
@router.post("/timesheets", status_code=201)
def create_timesheet(payload: TimesheetCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    # Locate staff/employee profile for active user
    from app.models.employee import Employee
    emp = db.query(Employee).filter(Employee.tenant_id == user.company_id, Employee.work_email == user.email).first()
    if not emp:
        # Fallback to first employee or raise
        first_emp = db.query(Employee).filter(Employee.tenant_id == user.company_id).first()
        if not first_emp:
            raise HTTPException(status_code=404, detail="Active user has no registered Employee profile")
        emp_id = first_emp.id
    else:
        emp_id = emp.id

    result = ProjectService.create_timesheet(db, payload, employee_id=emp_id, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/timesheets")
def get_timesheets(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.list_timesheets(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/timesheets/{id}/approve")
def approve_timesheet(id: str, payload: TimesheetApproveSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.approve_timesheet(db, timesheet_id=id, status=payload.status, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Milestone CRUD
@router.post("/milestones", status_code=201)
def create_milestone(payload: MilestoneCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.create_milestone(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/milestones")
def get_milestones(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.list_milestones(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

# Risk CRUD
@router.post("/risks", status_code=201)
def create_risk(payload: RiskCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.create_risk(db, payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/risks")
def get_risks(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = ProjectService.list_risks(db, tenant_id=user.company_id)
    return {"success": True, "data": result}
