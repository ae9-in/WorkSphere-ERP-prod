from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, Boolean, Float, DateTime, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel, BaseModel

class Shift(TenantBaseModel):
    __tablename__ = "shifts"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    start_time = Column(String, nullable=False) # HH:MM
    end_time = Column(String, nullable=False) # HH:MM
    break_duration = Column(Integer, default=60, nullable=False) # in minutes
    grace_period = Column(Integer, default=15, nullable=False) # in minutes
    min_working_hours = Column(Float, default=8.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_shift_code"),
    )


class ShiftAssignment(TenantBaseModel):
    __tablename__ = "shift_assignments"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, index=True)
    effective_date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    is_active = Column(Boolean, default=True, nullable=False)

    employee = orm_relationship("Employee")
    shift = orm_relationship("Shift")


class Attendance(TenantBaseModel):
    __tablename__ = "attendance_records"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String, nullable=False)
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    check_in = Column(String, nullable=True) # HH:MM:SS
    check_out = Column(String, nullable=True) # HH:MM:SS
    status = Column(String, default="present", nullable=False) # present, absent, wfh, late, half_day, leave, holiday, weekend
    work_mode = Column(String, default="onsite", nullable=False) # onsite, remote, hybrid
    
    # Extended Attendance Fields
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    working_hours = Column(Float, default=0.0, nullable=False)
    ot_hours = Column(Float, default=0.0, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    geofence_status = Column(String, default="unknown", nullable=False) # inside, outside, unknown
    notes = Column(String, nullable=True)

    employee = orm_relationship("Employee")
    shift = orm_relationship("Shift")
    breaks = orm_relationship("AttendanceBreak", back_populates="attendance", cascade="all, delete-orphan")
    regularizations = orm_relationship("AttendanceRegularization", back_populates="attendance", cascade="all, delete-orphan")
    overtimes = orm_relationship("OvertimeRequest", back_populates="attendance", cascade="all, delete-orphan")
    timelines = orm_relationship("AttendanceTimeline", back_populates="attendance", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_date"),
    )


class AttendanceBreak(TenantBaseModel):
    __tablename__ = "attendance_breaks"

    attendance_record_id = Column(UUID(as_uuid=True), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True)
    break_type = Column(String, default="lunch", nullable=False) # lunch, tea, personal, official
    start_time = Column(String, nullable=False) # HH:MM:SS
    end_time = Column(String, nullable=True) # HH:MM:SS
    duration_minutes = Column(Integer, nullable=True)

    attendance = orm_relationship("Attendance", back_populates="breaks")


class AttendanceRegularization(TenantBaseModel):
    __tablename__ = "attendance_regularizations"

    attendance_record_id = Column(UUID(as_uuid=True), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True)
    request_type = Column(String, nullable=False) # missed_punch, late_regularize, other
    requested_check_in = Column(String, nullable=True) # HH:MM:SS
    requested_check_out = Column(String, nullable=True) # HH:MM:SS
    reason = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    comments = Column(String, nullable=True)

    attendance = orm_relationship("Attendance", back_populates="regularizations")


class OvertimeRequest(TenantBaseModel):
    __tablename__ = "overtime_requests"

    attendance_record_id = Column(UUID(as_uuid=True), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True)
    ot_hours = Column(Float, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)

    attendance = orm_relationship("Attendance", back_populates="overtimes")


class AttendanceTimeline(TenantBaseModel):
    __tablename__ = "attendance_timelines"

    attendance_record_id = Column(UUID(as_uuid=True), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False) # check_in, check_out, break_start, break_end, regularization_request, regularization_approved, overtime_approved
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    performed_by = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    attendance = orm_relationship("Attendance", back_populates="timelines")
