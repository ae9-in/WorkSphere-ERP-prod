from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.notification import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
def get_notifications(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")

    result = NotificationService.get_notifications(
        db, tenant_id=tenant_id, user_role=user.role, user_employee_id=user.employee_id
    )
    return {
        "success": True,
        "data": result
    }

@router.patch("/{id}/read")
def mark_read(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    NotificationService.mark_read(
        db, notif_id=id, tenant_id=tenant_id, user_role=user.role, user_employee_id=user.employee_id
    )
    return {
        "success": True,
        "message": "Marked as read"
    }

@router.patch("/read-all")
def mark_all_read(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    NotificationService.mark_all_read(
        db, tenant_id=tenant_id, user_role=user.role, user_employee_id=user.employee_id
    )
    return {
        "success": True,
        "message": "All marked as read"
    }
