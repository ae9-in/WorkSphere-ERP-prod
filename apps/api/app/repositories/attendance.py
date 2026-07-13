from app.repositories.base import BaseRepository
from app.models.attendance import Attendance
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

class AttendanceRepository(BaseRepository[Attendance]):
    def __init__(self):
        super().__init__(Attendance)

    def get_record_by_date(self, db: Session, employee_id: UUID, date_str: str) -> Optional[Attendance]:
        return db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == date_str,
            Attendance.deleted_at == None
        ).first()

    def get_by_date_range(self, db: Session, tenant_id: UUID, start_date: str, end_date: str) -> List[Attendance]:
        return db.query(Attendance).filter(
            Attendance.tenant_id == tenant_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.deleted_at == None
        ).order_by(Attendance.date.desc()).all()
