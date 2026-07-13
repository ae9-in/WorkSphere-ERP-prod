from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.lms import LMSService
from app.schemas.lms import (
    CourseCreateSchema, CourseEnrollSchema, CourseProgressUpdateSchema
)

router = APIRouter(prefix="/lms", tags=["lms"])

@router.post("/courses", status_code=201)
def create_course(payload: CourseCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LMSService.create_course(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/courses")
def list_courses(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LMSService.list_courses(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/enrollments", status_code=201)
def enroll_employee(payload: CourseEnrollSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LMSService.enroll_employee(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.patch("/enrollments/{id}/progress")
def update_progress(id: str, payload: CourseProgressUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LMSService.update_progress(db, enrollment_id=id, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/employee/{id}/enrollments")
def get_employee_enrollments(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LMSService.get_enrollments_by_employee(db, employee_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }
