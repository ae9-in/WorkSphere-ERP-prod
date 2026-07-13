from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.models.helpdesk import Ticket, TicketComment
from app.models.employee import Employee
from app.schemas.helpdesk import (
    TicketCreateSchema, TicketAssignSchema, TicketStatusUpdateSchema, TicketCommentCreateSchema
)

def serialize_ticket(t: Ticket) -> dict:
    return {
        "_id": str(t.id),
        "title": t.title,
        "description": t.description,
        "category": t.category,
        "priority": t.priority,
        "status": t.status,
        "employeeId": str(t.employee_id),
        "assignedToId": str(t.assigned_to_id) if t.assigned_to_id else None,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
        "comments": [
            {
                "_id": str(c.id),
                "authorId": str(c.author_id),
                "content": c.content,
                "createdAt": c.created_at.isoformat()
            } for c in t.comments
        ]
    }

class HelpdeskService:
    @staticmethod
    def create_ticket(db: Session, payload: TicketCreateSchema, tenant_id: uuid.UUID, employee_id: uuid.UUID) -> dict:
        ticket = Ticket(
            tenant_id=tenant_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            priority=payload.priority,
            status="open",
            employee_id=employee_id
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return serialize_ticket(ticket)

    @staticmethod
    def list_tickets(db: Session, tenant_id: uuid.UUID, employee_id: Optional[str] = None) -> List[dict]:
        query = db.query(Ticket).filter(Ticket.tenant_id == tenant_id)
        if employee_id:
            query = query.filter(Ticket.employee_id == uuid.UUID(employee_id))
        tickets = query.order_by(Ticket.created_at.desc()).all()
        return [serialize_ticket(t) for t in tickets]

    @staticmethod
    def assign_ticket(db: Session, ticket_id: str, payload: TicketAssignSchema, tenant_id: uuid.UUID) -> dict:
        ticket_uuid = uuid.UUID(ticket_id)
        ticket = db.query(Ticket).filter(Ticket.id == ticket_uuid, Ticket.tenant_id == tenant_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        ticket.assigned_to_id = uuid.UUID(payload.assignedToId)
        ticket.status = "in_progress"
        db.commit()
        db.refresh(ticket)
        return serialize_ticket(ticket)

    @staticmethod
    def update_status(db: Session, ticket_id: str, payload: TicketStatusUpdateSchema, tenant_id: uuid.UUID) -> dict:
        ticket_uuid = uuid.UUID(ticket_id)
        ticket = db.query(Ticket).filter(Ticket.id == ticket_uuid, Ticket.tenant_id == tenant_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        ticket.status = payload.status
        db.commit()
        db.refresh(ticket)
        return serialize_ticket(ticket)

    @staticmethod
    def add_comment(db: Session, ticket_id: str, payload: TicketCommentCreateSchema, tenant_id: uuid.UUID, employee_id: uuid.UUID) -> dict:
        ticket_uuid = uuid.UUID(ticket_id)
        ticket = db.query(Ticket).filter(Ticket.id == ticket_uuid, Ticket.tenant_id == tenant_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        comment = TicketComment(
            tenant_id=tenant_id,
            ticket_id=ticket_uuid,
            author_id=employee_id,
            content=payload.content
        )
        db.add(comment)
        db.commit()
        db.refresh(ticket)
        return serialize_ticket(ticket)
