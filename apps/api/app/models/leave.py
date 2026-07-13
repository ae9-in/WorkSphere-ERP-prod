from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Integer, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import TenantBaseModel, BaseModel

class LeaveType(TenantBaseModel):
    __tablename__ = "leave_types"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False) # e.g., 'AL', 'SL', 'CL'
    is_paid = Column(Boolean, default=True, nullable=False)
    accrual_based = Column(Boolean, default=False, nullable=False)
    max_days = Column(Float, default=12.0, nullable=False)
    carry_forward = Column(Boolean, default=False, nullable=False)
    gender = Column(String, default="all", nullable=False) # male, female, all
    requires_approval = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_leave_code"),
    )


class LeaveBalance(TenantBaseModel):
    __tablename__ = "leave_balances"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    allocated = Column(Float, default=0.0, nullable=False)
    used = Column(Float, default=0.0, nullable=False)
    pending = Column(Float, default=0.0, nullable=False)
    available = Column(Float, default=0.0, nullable=False)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")

    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_employee_type_year"),
    )


class LeaveApplication(TenantBaseModel):
    __tablename__ = "leave_applications"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True)
    from_date = Column(DateTime, nullable=False)
    to_date = Column(DateTime, nullable=False)
    days = Column(Float, nullable=False)
    half_day = Column(Boolean, default=False, nullable=False)
    half_day_type = Column(String, nullable=True) # first_half, second_half
    reason = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # draft, pending, approved, rejected, cancelled, withdrawn
    workflow_instance_id = Column(UUID(as_uuid=True), nullable=True)
    attachment_urls = Column(JSON, default=list, nullable=False)
    applied_on = Column(DateTime, default=datetime.utcnow, nullable=False)
    actioned_by = Column(String, nullable=True)
    actioned_at = Column(DateTime, nullable=True)
    lop_days = Column(Float, default=0.0, nullable=False)
    is_sandwich = Column(Boolean, default=False, nullable=False)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")
    comments = relationship("LeaveApplicationComment", back_populates="leave_application", cascade="all, delete-orphan")
    timelines = relationship("LeaveTimeline", back_populates="leave_application", cascade="all, delete-orphan")


class LeaveApplicationComment(BaseModel):
    __tablename__ = "leave_application_comments"

    leave_application_id = Column(UUID(as_uuid=True), ForeignKey("leave_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    user_name = Column(String, nullable=False)
    comment = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    leave_application = relationship("LeaveApplication", back_populates="comments")


class LeaveLedger(TenantBaseModel):
    __tablename__ = "leave_ledgers"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String, nullable=False) # opening, accrual, adjustment, leave_taken, encashment, carry_forward, expiry
    days = Column(Float, nullable=False)
    previous_balance = Column(Float, nullable=False)
    new_balance = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")


class LeaveEncashment(TenantBaseModel):
    __tablename__ = "leave_encashments"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True)
    days = Column(Float, nullable=False)
    amount = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    reason = Column(String, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    comments = Column(String, nullable=True)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")


class LeaveCarryForward(TenantBaseModel):
    __tablename__ = "leave_carry_forwards"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True)
    source_year = Column(Integer, nullable=False)
    target_year = Column(Integer, nullable=False)
    days_carried = Column(Float, nullable=False)
    days_expired = Column(Float, nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")


class LeaveTimeline(TenantBaseModel):
    __tablename__ = "leave_timelines"

    leave_application_id = Column(UUID(as_uuid=True), ForeignKey("leave_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False) # created, submitted, approved, rejected, cancelled, withdrawn, comment_added
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    performed_by = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    leave_application = relationship("LeaveApplication", back_populates="timelines")
