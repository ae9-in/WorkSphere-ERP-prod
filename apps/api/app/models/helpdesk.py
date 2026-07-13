import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel

class Ticket(TenantBaseModel):
    __tablename__ = "helpdesk_tickets"

    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, default="general", nullable=False) # hr, it, payroll, facilities, general
    priority = Column(String, default="medium", nullable=False) # low, medium, high
    status = Column(String, default="open", nullable=False) # open, in_progress, resolved, closed
    
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    comments = orm_relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")

class TicketComment(TenantBaseModel):
    __tablename__ = "helpdesk_comments"

    ticket_id = Column(UUID(as_uuid=True), ForeignKey("helpdesk_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(String, nullable=False)

    ticket = orm_relationship("Ticket", back_populates="comments")
