from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.workflow import WorkflowService, ActionRequest, DelegateRequest
from app.schemas.workflow import WorkflowAutomationCreateSchema, WorkflowAutomationUpdateSchema, WorkflowExecutionCreateSchema

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

# ── NEW WORKFLOW AUTOMATION PLATFORM API ROUTERS ──

@router.get("/automation")
def list_automations(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.list_automations(db, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.post("/automation")
def create_automation(payload: WorkflowAutomationCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.create_automation(db, payload=payload, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.put("/automation/{id}")
def update_automation(id: str, payload: WorkflowAutomationUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.update_automation(db, automation_id=id, payload=payload, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.post("/automation/{id}/trigger")
def trigger_workflow_run(id: str, payload: WorkflowExecutionCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.execute_workflow_run(db, workflow_id=id, variables=payload.variables or {}, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.get("/executions")
def list_executions(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.list_executions(db, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.get("/executions/{id}/logs")
def get_execution_logs(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.get_execution_logs(db, execution_id=id, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.get("/stats")
def get_workflow_stats(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    result = WorkflowService.get_workflow_stats(db, tenant_id=tenant_id)
    return {"success": True, "data": result}
