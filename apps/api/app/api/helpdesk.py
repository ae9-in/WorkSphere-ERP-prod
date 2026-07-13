from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.helpdesk import HelpdeskService
from app.schemas.helpdesk import (
    TicketCreateSchema, TicketAssignSchema, TicketStatusUpdateSchema, TicketCommentCreateSchema
)

router = APIRouter(prefix="/helpdesk", tags=["helpdesk"])

@router.post("/tickets", status_code=201)
def create_ticket(payload: TicketCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = HelpdeskService.create_ticket(db, payload=payload, tenant_id=tenant_id, employee_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/tickets")
def list_tickets(employeeId: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = HelpdeskService.list_tickets(db, tenant_id=tenant_id, employee_id=employeeId)
    return {
        "success": True,
        "data": result
    }

@router.post("/tickets/{id}/assign")
def assign_ticket(id: str, payload: TicketAssignSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = HelpdeskService.assign_ticket(db, ticket_id=id, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.patch("/tickets/{id}/status")
def update_status(id: str, payload: TicketStatusUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = HelpdeskService.update_status(db, ticket_id=id, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/tickets/{id}/comments")
def add_comment(id: str, payload: TicketCommentCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = HelpdeskService.add_comment(db, ticket_id=id, payload=payload, tenant_id=tenant_id, employee_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }
