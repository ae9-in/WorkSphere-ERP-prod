from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import or_
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.notification import NotificationRepository
from app.models.notification import Notification

notification_repo = NotificationRepository()

class NotificationService:
    @staticmethod
    def get_notifications(db: Session, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> List[dict]:
        query = db.query(Notification).filter(Notification.tenant_id == tenant_id, Notification.deleted_at == None)

        if user_role == "employee":
            query = query.filter(
                or_(
                    Notification.recipient_id == user_employee_id,
                    Notification.recipient_id == None,
                    Notification.recipient_id == ""
                )
            )

        notifications = query.order_by(Notification.created_at.desc()).limit(50).all()

        formatted = []
        for n in notifications:
            formatted.append({
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "recipientId": n.recipient_id,
                "read": n.read,
                "url": n.url,
                "actorName": n.actor_name,
                "createdAt": n.created_at.isoformat() if n.created_at else None
            })
        return formatted

    @staticmethod
    def mark_read(db: Session, notif_id: str, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> bool:
        try:
            notif_uuid = uuid.UUID(notif_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid notification ID format")
            
        query = db.query(Notification).filter(Notification.id == notif_uuid, Notification.tenant_id == tenant_id, Notification.deleted_at == None)
        if user_role == "employee":
            query = query.filter(Notification.recipient_id == user_employee_id)

        record = query.first()
        if not record:
            raise HTTPException(status_code=404, detail="Notification not found or access denied.")

        record.read = True
        db.commit()
        return True

    @staticmethod
    def mark_all_read(db: Session, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> bool:
        query = db.query(Notification).filter(Notification.tenant_id == tenant_id, Notification.read == False, Notification.deleted_at == None)
        if user_role == "employee":
            query = query.filter(Notification.recipient_id == user_employee_id)

        records = query.all()
        for r in records:
            r.read = True
        db.commit()
        return True
