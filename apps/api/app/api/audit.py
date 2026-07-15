from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.audit import AuditService
from typing import Optional

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("")
@router.get("/logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    email: Optional[str] = None,
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")

    result = AuditService.get_logs(
        db, tenant_id=tenant_id, page=page, limit=limit, action=action, email=email
    )
    return {
        "success": True,
        "data": result
    }
