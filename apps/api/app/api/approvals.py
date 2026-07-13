from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.models.employee import Employee
from app.models.approval import Approval
from app.models.notification import Notification
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/approvals", tags=["approvals"])

class ApprovalRequest(BaseModel):
    employeeId: Optional[str] = None
    fullName: Optional[str] = None
    type: str # Leave Request, Attendance Regularization, Expense Claim
    details: str
    dateRange: Optional[str] = None
    amount: Optional[str] = None

@router.get("")
def get_approvals(status: str = "pending", user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")

    query = db.query(Approval).filter(Approval.tenant_id == tenant_id)
    if status != "all":
        query = query.filter(Approval.status == status)

    if user.role == "employee":
        query = query.filter(Approval.employee_id == user.employee_id)

    approvals = query.order_by(Approval.requested_at.desc()).all()

    # Formatter output
    formatted = []
    for a in approvals:
        formatted.append({
            "id": str(a.id),
            "employeeId": a.employee_id,
            "fullName": a.full_name,
            "type": a.type,
            "details": a.details,
            "status": a.status,
            "dateRange": a.date_range,
            "amount": a.amount,
            "requestedAt": a.requested_at.isoformat() if a.requested_at else None,
            "resolvedAt": a.resolved_at.isoformat() if a.resolved_at else None
        })
    return {"success": True, "data": formatted}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_approval(payload: ApprovalRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    employee_id = user.employee_id if user.role == "employee" else payload.employeeId
    full_name = user.full_name if user.role == "employee" else payload.fullName

    if not employee_id or not full_name:
        # Fallback to lookup employee
        emp = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.employee_id == employee_id).first()
        full_name = emp.full_name if emp else "System User"

    approval = Approval(
        tenant_id=tenant_id,
        employee_id=employee_id,
        full_name=full_name,
        type=payload.type,
        details=payload.details,
        status="pending",
        date_range=payload.dateRange,
        amount=payload.amount,
        requested_at=datetime.utcnow()
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    return {
        "success": True,
        "data": {
            "id": str(approval.id),
            "employeeId": approval.employee_id,
            "fullName": approval.full_name,
            "type": approval.type,
            "details": approval.details,
            "status": approval.status
        }
    }

@router.patch("/{id}/approve")
def approve_request(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    app_uuid = uuid.UUID(id)

    approval = db.query(Approval).filter(Approval.id == app_uuid, Approval.tenant_id == tenant_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found or access denied.")

    approval.status = "approved"
    approval.resolved_at = datetime.utcnow()

    # Create notification
    notif = Notification(
        tenant_id=tenant_id,
        type="approval_granted",
        title=f"{approval.type} Approved",
        message=f"{approval.full_name}'s {approval.type.lower()} has been approved.",
        read=False,
        url="/approvals",
        actor_name=approval.full_name
    )
    db.add(notif)
    db.commit()
    db.refresh(approval)

    return {"success": True, "data": {"id": str(approval.id), "status": approval.status}}

@router.patch("/{id}/reject")
def reject_request(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    app_uuid = uuid.UUID(id)

    approval = db.query(Approval).filter(Approval.id == app_uuid, Approval.tenant_id == tenant_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found or access denied.")

    approval.status = "rejected"
    approval.resolved_at = datetime.utcnow()

    notif = Notification(
        tenant_id=tenant_id,
        type="approval_rejected",
        title=f"{approval.type} Rejected",
        message=f"{approval.full_name}'s {approval.type.lower()} has been rejected.",
        read=False,
        url="/approvals",
        actor_name=approval.full_name
    )
    db.add(notif)
    db.commit()
    db.refresh(approval)

    return {"success": True, "data": {"id": str(approval.id), "status": approval.status}}
