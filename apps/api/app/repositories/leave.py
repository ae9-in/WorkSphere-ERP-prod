from app.repositories.base import BaseRepository
from app.models.leave import LeaveType, LeaveBalance, LeaveApplication
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class LeaveRepository(BaseRepository[LeaveApplication]):
    def __init__(self):
        super().__init__(LeaveApplication)

    def get_balances(self, db: Session, employee_id: UUID, year: int) -> List[LeaveBalance]:
        return db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.year == year,
            LeaveBalance.deleted_at == None
        ).all()

    def get_balance_by_type(self, db: Session, employee_id: UUID, leave_type_id: UUID, year: int) -> Optional[LeaveBalance]:
        return db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == leave_type_id,
            LeaveBalance.year == year,
            LeaveBalance.deleted_at == None
        ).first()

    def get_leave_types(self, db: Session, tenant_id: UUID) -> List[LeaveType]:
        return db.query(LeaveType).filter(
            LeaveType.tenant_id == tenant_id,
            LeaveType.deleted_at == None
        ).all()

    def get_leave_type_by_code(self, db: Session, tenant_id: UUID, code: str) -> Optional[LeaveType]:
        return db.query(LeaveType).filter(
            LeaveType.tenant_id == tenant_id,
            LeaveType.code == code,
            LeaveType.deleted_at == None
        ).first()

    def get_applications(self, db: Session, tenant_id: UUID, employee_id: Optional[UUID] = None) -> List[LeaveApplication]:
        query = db.query(LeaveApplication).filter(
            LeaveApplication.tenant_id == tenant_id,
            LeaveApplication.deleted_at == None
        )
        if employee_id:
            query = query.filter(LeaveApplication.employee_id == employee_id)
        return query.order_by(LeaveApplication.applied_on.desc()).all()
