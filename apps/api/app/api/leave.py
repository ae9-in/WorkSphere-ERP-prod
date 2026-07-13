from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.leave import (
    LeaveTypeCreateSchema, LeaveApplyRequest, LeaveActionRequest,
    LeaveCancelRequest, LeaveWithdrawRequest, LeaveAccrualRequest, LeaveEncashRequest
)
from app.services.leave import LeaveService

router = APIRouter(prefix="/leave", tags=["leave"])

@router.post("/types", status_code=201)
def create_leave_type(payload: LeaveTypeCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    lt = LeaveService.create_leave_type(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": lt
    }

@router.get("/types")
def get_leave_types(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    types = LeaveService.list_leave_types(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": types
    }

@router.post("/apply", status_code=201)
def apply_leave(payload: LeaveApplyRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LeaveService.apply_leave(db, payload=payload, user=user, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/applications")
def list_applications(
    status: Optional[str] = Query(None),
    employeeId: Optional[str] = Query(None),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = LeaveService.list_applications(
        db, tenant_id=tenant_id, status=status, employee_id_str=employeeId
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/applications/{id}")
def get_application(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LeaveService.get_application(db, app_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/applications/{id}/approve")
def approve_leave(id: str, payload: LeaveActionRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LeaveService.action_leave_application(
        db, app_id=id, approve=True, comments_text=payload.comments, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result
    }

@router.post("/applications/{id}/reject")
def reject_leave(id: str, payload: LeaveActionRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = LeaveService.action_leave_application(
        db, app_id=id, approve=False, comments_text=payload.comments, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/balances")
def get_leave_balances(
    employeeId: Optional[str] = Query(None),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = LeaveService.get_balances(db, employee_id_str=employeeId, user=user, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("")
def list_applications_root(
    status: Optional[str] = Query(None),
    employeeId: Optional[str] = Query(None),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = LeaveService.list_applications(
        db, tenant_id=tenant_id, status=status, employee_id_str=employeeId
    )
    return {"success": True, "data": result}

@router.get("/balance")
def get_leave_balances_alias(
    employeeId: Optional[str] = Query(None),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = LeaveService.get_balances(db, employee_id_str=employeeId, user=user, tenant_id=tenant_id)
    return {"success": True, "data": result}

@router.post("/cancel")
def cancel_leave(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    app_uuid = uuid.UUID(payload["applicationId"])
    result = LeaveService.cancel_leave(
        db, app_id=app_uuid, comment=payload.get("comments"), user=user, tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.post("/withdraw")
def withdraw_leave(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    app_uuid = uuid.UUID(payload["applicationId"])
    result = LeaveService.withdraw_leave(
        db, app_id=app_uuid, user=user, tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.post("/accrual")
def run_accrual(payload: LeaveAccrualRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    emp_uuid = uuid.UUID(payload.employeeId) if payload.employeeId else None
    lt_uuid = uuid.UUID(payload.leaveTypeId) if payload.leaveTypeId else None
    result = LeaveService.accrue_leaves(
        db, employee_id=emp_uuid, leave_type_id=lt_uuid, tenant_id=user.company_id
    )
    return {"success": True, "data": {"accruedCount": result}, "message": f"Successfully accrued leaves for {result} records."}

@router.post("/carry-forward")
def run_carry_forward(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = LeaveService.process_carry_forward(
        db, source_year=payload["sourceYear"], target_year=payload["targetYear"], tenant_id=user.company_id
    )
    return {"success": True, "data": {"processedCount": result}, "message": f"Successfully carried forward {result} balances."}

@router.post("/encashment")
def request_encashment(payload: LeaveEncashRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    emp_uuid = user.employee_id
    if payload.employeeId and user.role != "employee":
        emp_uuid = uuid.UUID(payload.employeeId)
    lt_uuid = uuid.UUID(payload.leaveTypeId)
    result = LeaveService.request_encashment(
        db, employee_id=emp_uuid, leave_type_id=lt_uuid, days=payload.days, reason=payload.reason, tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.get("/encashment")
def list_encashments(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = LeaveService.list_encashments(
        db, tenant_id=user.company_id, user_role=user.role, user_employee_id=user.employee_id
    )
    return {"success": True, "data": result}

@router.post("/encashment/{id}/approve")
def approve_encashment(id: str, payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    enc_uuid = uuid.UUID(id)
    result = LeaveService.approve_encashment(
        db, encash_id=enc_uuid, status=payload["status"], approved_by=user.email, comments=payload.get("comments"), tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.get("/ledger")
def list_ledgers(employeeId: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    emp_uuid = user.employee_id
    if employeeId and user.role != "employee":
        emp_uuid = uuid.UUID(employeeId)
    result = LeaveService.list_ledgers(db, employee_id=emp_uuid, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.get("/dashboard")
def get_leave_dashboard(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    from app.models.leave import LeaveApplication
    total_pending = db.query(LeaveApplication).filter(LeaveApplication.tenant_id == tenant_id, LeaveApplication.status == "pending", LeaveApplication.deleted_at == None).count()
    total_approved = db.query(LeaveApplication).filter(LeaveApplication.tenant_id == tenant_id, LeaveApplication.status == "approved", LeaveApplication.deleted_at == None).count()
    
    return {
        "success": True,
        "data": {
            "pendingCount": total_pending,
            "approvedCount": total_approved,
            "employeesOnLeaveToday": 0
        }
    }

@router.get("/analytics")
def get_leave_analytics(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    from sqlalchemy import func
    from app.models.leave import LeaveApplication
    
    avg_duration = db.query(func.avg(LeaveApplication.days)).filter(
        LeaveApplication.tenant_id == tenant_id,
        LeaveApplication.status == "approved",
        LeaveApplication.deleted_at == None
    ).scalar() or 0.0

    total_lop = db.query(func.sum(LeaveApplication.lop_days)).filter(
        LeaveApplication.tenant_id == tenant_id,
        LeaveApplication.status == "approved",
        LeaveApplication.deleted_at == None
    ).scalar() or 0.0
    
    return {
        "success": True,
        "data": {
            "averageLeaveDuration": round(float(avg_duration), 1),
            "totalLopDays": round(float(total_lop), 1)
        }
    }
