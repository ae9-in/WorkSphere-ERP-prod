from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.ai_interview import AIInterviewService
from app.schemas.ai_interview import (
    AIInterviewSessionCreateSchema, AIInterviewResponseSubmitSchema,
    AIInterviewSessionUpdateSchema
)

router = APIRouter(prefix="/ai-interviews", tags=["ai-interviews"])

@router.post("", status_code=201)
def create_session(payload: AIInterviewSessionCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AIInterviewService.create_session(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/{id}/respond")
def submit_response(id: str, payload: AIInterviewResponseSubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AIInterviewService.submit_response(db, session_id=id, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/{id}/complete")
def complete_session(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AIInterviewService.complete_session(db, session_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/{id}")
def get_session(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AIInterviewService.get_session(db, session_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }
