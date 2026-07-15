from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
import math
from typing import Optional, Dict, Any, List

from app.repositories.audit import AuditRepository
from app.models.audit import AuditLog
from app.models.user import User

audit_repo = AuditRepository()

class AuditService:
    @staticmethod
    def get_logs(db: Session, tenant_id: uuid.UUID, page: int, limit: int, action: Optional[str], email: Optional[str]) -> dict:
        query = db.query(AuditLog, User.email.label("user_email"))\
                  .outerjoin(User, AuditLog.user_id == User.id)\
                  .filter(AuditLog.tenant_id == tenant_id, AuditLog.deleted_at == None)

        if action:
            query = query.filter(AuditLog.action == action)
        if email:
            query = query.filter(
                (AuditLog.email.ilike(f"%{email}%")) |
                (User.email.ilike(f"%{email}%"))
            )

        total = query.count()
        offset = (page - 1) * limit
        results = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

        formatted = []
        for l, user_email in results:
            formatted.append({
                "id": str(l.id),
                "userId": str(l.user_id) if l.user_id else None,
                "email": user_email if user_email else l.email,
                "action": l.action,
                "details": l.details,
                "ipAddress": l.ip_address,
                "createdAt": l.created_at.isoformat() if l.created_at else None
            })

        return {
            "logs": formatted,
            "total": total,
            "page": page,
            "totalPages": math.ceil(total / limit)
        }
