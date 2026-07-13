from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.models.employee import EmployeeTimeline

class TimelineService:
    @staticmethod
    def log_event(
        db: Session,
        tenant_id: uuid.UUID,
        employee_id: uuid.UUID,
        event_type: str,
        title: str,
        description: Optional[str] = None,
        performed_by: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> EmployeeTimeline:
        event = EmployeeTimeline(
            tenant_id=tenant_id,
            employee_id=employee_id,
            event_type=event_type,
            title=title,
            description=description,
            event_date=datetime.utcnow(),
            performed_by=performed_by,
            metadata_json=metadata_json
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_timeline(db: Session, employee_id: uuid.UUID, tenant_id: uuid.UUID) -> List[EmployeeTimeline]:
        return db.query(EmployeeTimeline).filter(
            EmployeeTimeline.employee_id == employee_id,
            EmployeeTimeline.tenant_id == tenant_id
        ).order_by(EmployeeTimeline.event_date.desc()).all()
