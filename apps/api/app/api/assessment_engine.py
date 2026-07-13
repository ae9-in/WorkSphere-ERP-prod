from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.assessment import AssessmentService
from app.schemas.assessment import (
    AssessmentTemplateCreateSchema, AssessmentAttemptStartSchema,
    AssessmentAttemptSubmitSchema
)

router = APIRouter(prefix="/assessment-engine", tags=["assessment-engine"])

@router.post("/templates", status_code=201)
def create_template(payload: AssessmentTemplateCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssessmentService.create_template(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/templates")
def list_templates(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssessmentService.list_templates(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/attempts", status_code=201)
def start_attempt(payload: AssessmentAttemptStartSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssessmentService.start_attempt(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/attempts/{id}/submit")
def submit_attempt(id: str, payload: AssessmentAttemptSubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssessmentService.submit_attempt(db, attempt_id=id, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/candidate/{id}/attempts")
def get_candidate_attempts(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssessmentService.get_attempts_by_candidate(db, candidate_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }
