from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from typing import List, Optional
from datetime import datetime

from app.models.attendance import Shift, ShiftAssignment
from app.schemas.attendance import ShiftSchema

class ShiftService:
    @staticmethod
    def create_shift(db: Session, payload: ShiftSchema, tenant_id: uuid.UUID) -> dict:
        # Check if code already exists
        existing = db.query(Shift).filter(
            Shift.tenant_id == tenant_id,
            Shift.code == payload.code,
            Shift.deleted_at == None
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Shift with code '{payload.code}' already exists.")

        shift = Shift(
            tenant_id=tenant_id,
            name=payload.name,
            code=payload.code,
            start_time=payload.startTime,
            end_time=payload.endTime,
            break_duration=payload.breakDuration,
            grace_period=payload.gracePeriod,
            min_working_hours=payload.minWorkingHours,
            is_active=payload.isActive
        )
        db.add(shift)
        db.commit()
        db.refresh(shift)
        return ShiftService.serialize_shift(shift)

    @staticmethod
    def list_shifts(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        shifts = db.query(Shift).filter(
            Shift.tenant_id == tenant_id,
            Shift.deleted_at == None
        ).order_by(Shift.created_at.desc()).all()
        return [ShiftService.serialize_shift(s) for s in shifts]

    @staticmethod
    def assign_shift(db: Session, employee_id: uuid.UUID, shift_id: uuid.UUID, effective_date: str, tenant_id: uuid.UUID) -> dict:
        # Verify shift exists
        shift = db.query(Shift).filter(Shift.id == shift_id, Shift.tenant_id == tenant_id).first()
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")

        # Deactivate previous assignments for this employee starting on or after this effective date
        db.query(ShiftAssignment).filter(
            ShiftAssignment.employee_id == employee_id,
            ShiftAssignment.tenant_id == tenant_id,
            ShiftAssignment.effective_date >= effective_date
        ).update({"is_active": False}, synchronize_session=False)

        assignment = ShiftAssignment(
            tenant_id=tenant_id,
            employee_id=employee_id,
            shift_id=shift_id,
            effective_date=effective_date,
            is_active=True
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return {
            "id": str(assignment.id),
            "employeeId": str(assignment.employee_id),
            "shiftId": str(assignment.shift_id),
            "effectiveDate": assignment.effective_date,
            "isActive": assignment.is_active
        }

    @staticmethod
    def get_active_assignment(db: Session, employee_id: uuid.UUID, date_str: str, tenant_id: uuid.UUID) -> Optional[Shift]:
        # Get active assignment for the date_str
        assignment = db.query(ShiftAssignment).filter(
            ShiftAssignment.employee_id == employee_id,
            ShiftAssignment.tenant_id == tenant_id,
            ShiftAssignment.effective_date <= date_str,
            ShiftAssignment.is_active == True,
            ShiftAssignment.deleted_at == None
        ).order_by(ShiftAssignment.effective_date.desc()).first()

        if assignment:
            return assignment.shift
        return None

    @staticmethod
    def serialize_shift(shift: Shift) -> dict:
        return {
            "id": str(shift.id),
            "name": shift.name,
            "code": shift.code,
            "startTime": shift.start_time,
            "endTime": shift.end_time,
            "breakDuration": shift.break_duration,
            "gracePeriod": shift.grace_period,
            "minWorkingHours": shift.min_working_hours,
            "isActive": shift.is_active
        }
