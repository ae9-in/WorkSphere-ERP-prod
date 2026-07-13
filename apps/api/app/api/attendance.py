from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.attendance import CheckInRequest, ShiftSchema
from app.services.attendance import AttendanceService

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("")
def get_attendance(
    date: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = AttendanceService.list_attendance(
        db, 
        tenant_id=tenant_id, 
        date=date, 
        page=page, 
        limit=limit, 
        user_role=user.role, 
        user_employee_id=user.employee_id
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/summary")
def get_attendance_summary(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AttendanceService.get_summary(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/weekly")
def get_weekly_trend(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AttendanceService.get_weekly_trend(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/checkin")
def check_in(payload: CheckInRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AttendanceService.check_in(
        db, 
        payload=payload, 
        tenant_id=tenant_id, 
        user_role=user.role, 
        user_employee_id=user.employee_id
    )
    return {
        "success": True,
        "data": result
    }

@router.patch("/{id}/checkout")
def check_out(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AttendanceService.check_out(db, record_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/shifts")
def list_shifts(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    from app.services.shift import ShiftService
    result = ShiftService.list_shifts(db, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/shifts")
def create_shift(payload: ShiftSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    from app.services.shift import ShiftService
    result = ShiftService.create_shift(db, payload=payload, tenant_id=user.company_id)
    return {"success": True, "data": result}

@router.post("/shifts/assign")
def assign_shift(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    from app.services.shift import ShiftService
    import uuid
    emp_id = uuid.UUID(payload["employeeId"])
    shift_id = uuid.UUID(payload["shiftId"])
    result = ShiftService.assign_shift(
        db, employee_id=emp_id, shift_id=shift_id, effective_date=payload["effectiveDate"], tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.post("/breaks/start")
def start_break(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    emp_uuid = user.employee_id
    if payload.get("employeeId") and user.role != "employee":
        emp_uuid = uuid.UUID(payload["employeeId"])
    result = AttendanceService.start_break(
        db, employee_id=emp_uuid, date_str=payload["date"], break_type=payload["breakType"], tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.post("/breaks/end")
def end_break(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    emp_uuid = user.employee_id
    if payload.get("employeeId") and user.role != "employee":
        emp_uuid = uuid.UUID(payload["employeeId"])
    result = AttendanceService.end_break(
        db, employee_id=emp_uuid, date_str=payload["date"], tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.post("/regularization")
def request_regularization(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    emp_uuid = user.employee_id
    if payload.get("employeeId") and user.role != "employee":
        emp_uuid = uuid.UUID(payload["employeeId"])
    result = AttendanceService.request_regularization(
        db,
        employee_id=emp_uuid,
        date_str=payload["date"],
        request_type=payload["requestType"],
        check_in=payload.get("checkIn"),
        check_out=payload.get("checkOut"),
        reason=payload["reason"],
        tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.get("/regularization")
def list_regularizations(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = AttendanceService.list_regularizations(
        db, tenant_id=user.company_id, user_role=user.role, user_employee_id=user.employee_id
    )
    return {"success": True, "data": result}

@router.post("/regularization/{id}/approve")
def approve_regularization(id: str, payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    import uuid
    reg_uuid = uuid.UUID(id)
    result = AttendanceService.approve_regularization(
        db, reg_id=reg_uuid, status=payload["status"], approved_by=user.email, comment=payload.get("comments"), tenant_id=user.company_id
    )
    return {"success": True, "data": result}

@router.post("/lock")
def lock_attendance(payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    result = AttendanceService.lock_attendance(
        db, start_date=payload["startDate"], end_date=payload["endDate"], tenant_id=user.company_id
    )
    return {"success": True, "data": {"lockedCount": result}, "message": f"Successfully locked {result} records."}

@router.get("/analytics")
def get_attendance_analytics(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    from sqlalchemy import func
    from app.models.attendance import Attendance
    
    total_records = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.deleted_at == None).count()
    if total_records == 0:
        return {"success": True, "data": {"averageWorkingHours": 0.0, "totalOvertimeHours": 0.0, "punctualityRate": 100.0}}
        
    avg_hours = db.query(func.avg(Attendance.working_hours)).filter(Attendance.tenant_id == tenant_id, Attendance.deleted_at == None).scalar() or 0.0
    total_ot = db.query(func.sum(Attendance.ot_hours)).filter(Attendance.tenant_id == tenant_id, Attendance.deleted_at == None).scalar() or 0.0
    late_count = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.status == "late", Attendance.deleted_at == None).count()
    
    punctuality = ((total_records - late_count) / total_records * 100) if total_records > 0 else 100.0
    
    return {
        "success": True,
        "data": {
            "averageWorkingHours": round(float(avg_hours), 2),
            "totalOvertimeHours": round(float(total_ot), 2),
            "punctualityRate": round(punctuality, 1)
        }
    }
