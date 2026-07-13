from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.workflow import WorkflowService, ActionRequest, DelegateRequest

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.get("/pending")
def get_pending_approvals(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")

    result = WorkflowService.get_pending_approvals(db, user=user, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/{id}/action")
def action_workflow_instance(id: str, payload: ActionRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = WorkflowService.action_workflow_instance(
        db, instance_id=id, payload=payload, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result
    }

@router.post("/{id}/delegate")
def delegate_workflow_instance(id: str, payload: DelegateRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = WorkflowService.delegate_workflow_instance(
        db, instance_id=id, payload=payload, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result
    }
