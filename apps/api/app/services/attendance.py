from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import uuid
import math
from typing import Optional, Dict, Any, List

from app.repositories.attendance import AttendanceRepository
from app.repositories.employee import EmployeeRepository
from app.models.attendance import (
    Attendance, Shift, ShiftAssignment, AttendanceBreak,
    AttendanceRegularization, OvertimeRequest, AttendanceTimeline
)
from app.models.settings import Branch
from app.models.employee import Employee
from app.models.audit import AuditLog
from app.schemas.attendance import CheckInRequest
from app.services.shift import ShiftService

attendance_repo = AttendanceRepository()
employee_repo = EmployeeRepository()

def calculate_hours_difference(start_str: str, end_str: str) -> float:
    try:
        t1 = datetime.strptime(start_str, "%H:%M:%S")
        t2 = datetime.strptime(end_str, "%H:%M:%S")
        delta = t2 - t1
        return max(0.0, round(delta.total_seconds() / 3600.0, 2))
    except Exception:
        return 0.0

def calculate_gps_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def serialize_attendance(record: Attendance) -> dict:
    return {
        "_id": str(record.id),
        "employeeId": record.employee.employee_id if record.employee else "",
        "fullName": record.full_name,
        "date": record.date,
        "checkIn": record.check_in,
        "checkOut": record.check_out,
        "status": record.status,
        "workMode": record.work_mode,
        "workingHours": record.working_hours,
        "otHours": record.ot_hours,
        "isLocked": record.is_locked,
        "geofenceStatus": record.geofence_status,
        "notes": record.notes,
        "companyId": str(record.tenant_id),
        "shift": ShiftService.serialize_shift(record.shift) if record.shift else None,
        "breaks": [
            {
                "id": str(b.id),
                "breakType": b.break_type,
                "startTime": b.start_time,
                "endTime": b.end_time,
                "durationMinutes": b.duration_minutes
            } for b in (record.breaks or [])
        ],
        "regularizations": [
            {
                "id": str(r.id),
                "requestType": r.request_type,
                "requestedCheckIn": r.requested_check_in,
                "requestedCheckOut": r.requested_check_out,
                "reason": r.reason,
                "status": r.status,
                "approvedBy": r.approved_by,
                "approvedAt": r.approved_at.isoformat() if r.approved_at else None,
                "comments": r.comments
            } for r in (record.regularizations or [])
        ],
        "overtimes": [
            {
                "id": str(o.id),
                "otHours": o.ot_hours,
                "reason": o.reason,
                "status": o.status,
                "approvedBy": o.approved_by
            } for o in (record.overtimes or [])
        ],
        "timelines": [
            {
                "id": str(t.id),
                "eventType": t.event_type,
                "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M:%S") if t.timestamp else None,
                "performedBy": t.performed_by,
                "metadataJson": t.metadata_json
            } for t in (record.timelines or [])
        ]
    }

class AttendanceService:
    @staticmethod
    def list_attendance(db: Session, tenant_id: uuid.UUID, date: str, page: int, limit: int, user_role: str, user_employee_id: Optional[uuid.UUID]) -> dict:
        query = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.deleted_at == None)
        
        if date:
            query = query.filter(Attendance.date == date)
            
        if user_role == "employee":
            query = query.filter(Attendance.employee_id == user_employee_id)
            
        query = query.order_by(Attendance.date.desc(), Attendance.check_in.asc())
        
        total = query.count()
        records = query.offset((page - 1) * limit).limit(limit).all()
        
        return {
            "records": [serialize_attendance(r) for r in records],
            "total": total,
            "page": page,
            "totalPages": (total + limit - 1) // limit
        }

    @staticmethod
    def get_summary(db: Session, tenant_id: uuid.UUID) -> dict:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        present = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "present", Attendance.deleted_at == None).count()
        wfh = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "wfh", Attendance.deleted_at == None).count()
        late = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "late", Attendance.deleted_at == None).count()
        absent = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "absent", Attendance.deleted_at == None).count()
        total = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.deleted_at == None).count()
        
        rate = ((present + wfh) / total * 100) if total > 0 else 0.0
        
        return {
            "today": today,
            "present": present,
            "wfh": wfh,
            "late": late,
            "absent": absent,
            "total": total,
            "attendanceRate": round(rate, 1)
        }

    @staticmethod
    def get_weekly_trend(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        days = []
        now = datetime.utcnow()
        for i in range(6, -1, -1):
            d = now - timedelta(days=i)
            if d.weekday() in [5, 6]:
                continue
                
            date_str = d.strftime("%Y-%m-%d")
            day_label = d.strftime("%a")
            
            present = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == date_str, Attendance.status == "present", Attendance.deleted_at == None).count()
            wfh = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == date_str, Attendance.status == "wfh", Attendance.deleted_at == None).count()
            late = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == date_str, Attendance.status == "late", Attendance.deleted_at == None).count()
            absent = db.query(Attendance).filter(Attendance.tenant_id == tenant_id, Attendance.date == date_str, Attendance.status == "absent", Attendance.deleted_at == None).count()
            
            days.append({
                "day": day_label,
                "date": date_str,
                "present": present,
                "wfh": wfh,
                "absent": absent,
                "late": late
            })
        return days

    @staticmethod
    def check_in(db: Session, payload: CheckInRequest, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> dict:
        if user_role == "employee":
            emp_id = user_employee_id
        else:
            target_emp_str = payload.employeeId
            if not target_emp_str:
                raise HTTPException(status_code=400, detail="Employee ID is required")
            try:
                emp_uuid = uuid.UUID(target_emp_str)
                emp = employee_repo.get_by_id(db, emp_uuid)
            except ValueError:
                emp = employee_repo.get_by_employee_id(db, target_emp_str, tenant_id)
                
            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")
            emp_id = emp.id
            
        emp_record = employee_repo.get_by_id(db, emp_id)
        if not emp_record:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        today = datetime.utcnow().strftime("%Y-%m-%d")
        now = datetime.now()
        check_in_time = now.strftime("%H:%M:%S")
        
        # Geofence validation
        geofence_status_str = "unknown"
        if payload.lat is not None and payload.lng is not None:
            # Query branch matching employee's location
            branch = db.query(Branch).filter(
                Branch.tenant_id == tenant_id,
                Branch.name == emp_record.location_name,
                Branch.deleted_at == None
            ).first()
            if branch:
                distance = calculate_gps_distance(payload.lat, payload.lng, branch.lat, branch.lng)
                geofence_status_str = "inside" if distance <= branch.geofence_radius else "outside"
        
        # Resolve Shift
        active_shift = ShiftService.get_active_assignment(db, emp_id, today, tenant_id)
        is_late = False
        shift_id_val = None
        if active_shift:
            shift_id_val = active_shift.id
            # Compare time
            try:
                shift_start = datetime.strptime(active_shift.start_time, "%H:%M")
                punch_time = datetime.strptime(now.strftime("%H:%M"), "%H:%M")
                allowed_time = shift_start + timedelta(minutes=active_shift.grace_period)
                if punch_time > allowed_time:
                    is_late = True
            except Exception:
                pass
        else:
            # Default fallback grace time
            is_late = now.hour >= 10

        status_str = "late" if is_late else "wfh" if payload.workMode == "remote" else "present"
        
        # Check duplicate
        existing = attendance_repo.get_record_by_date(db, emp_id, today)
        if existing:
            raise HTTPException(status_code=409, detail="Already checked in for today.")
            
        record = Attendance(
            tenant_id=tenant_id,
            employee_id=emp_id,
            full_name=emp_record.full_name,
            date=today,
            check_in=check_in_time,
            status=status_str,
            work_mode=payload.workMode,
            shift_id=shift_id_val,
            geofence_status=geofence_status_str
        )
        db.add(record)
        db.flush()

        # Log timeline event
        timeline = AttendanceTimeline(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            event_type="check_in",
            performed_by=emp_record.work_email,
            metadata_json={
                "time": check_in_time,
                "workMode": payload.workMode,
                "geofenceStatus": geofence_status_str
            }
        )
        db.add(timeline)

        db.commit()
        db.refresh(record)
        return serialize_attendance(record)

    @staticmethod
    def check_out(db: Session, record_id: str, tenant_id: uuid.UUID) -> dict:
        now = datetime.now()
        check_out_time = now.strftime("%H:%M:%S")
        
        try:
            record_uuid = uuid.UUID(record_id)
            record = db.query(Attendance).filter(Attendance.id == record_uuid, Attendance.tenant_id == tenant_id).first()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid record ID format")
            
        if not record:
            raise HTTPException(status_code=404, detail="Attendance record not found")

        if record.is_locked:
            raise HTTPException(status_code=400, detail="Attendance record is locked and cannot be modified.")
            
        record.check_out = check_out_time
        
        # Calculate working hours
        total_hours = calculate_hours_difference(record.check_in, check_out_time)
        
        # Deduct breaks
        break_minutes = 0
        for b in (record.breaks or []):
            if b.duration_minutes:
                break_minutes += b.duration_minutes
        
        actual_work_hours = max(0.0, total_hours - (break_minutes / 60.0))
        record.working_hours = round(actual_work_hours, 2)

        # Overtime detection
        min_hours = 8.0
        if record.shift:
            min_hours = record.shift.min_working_hours

        if actual_work_hours > min_hours:
            ot = round(actual_work_hours - min_hours, 2)
            record.ot_hours = ot
            # Auto-create OT request
            ot_req = OvertimeRequest(
                tenant_id=tenant_id,
                attendance_record_id=record.id,
                ot_hours=ot,
                reason="Auto-calculated shift overtime",
                status="pending"
            )
            db.add(ot_req)

        # Check half day / absent rules
        if actual_work_hours < (min_hours / 2.0):
            record.status = "absent"
        elif actual_work_hours < min_hours:
            record.status = "half_day"

        # Log timeline event
        timeline = AttendanceTimeline(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            event_type="check_out",
            performed_by=record.employee.work_email if record.employee else "system",
            metadata_json={
                "time": check_out_time,
                "workedHours": record.working_hours,
                "otHours": record.ot_hours
            }
        )
        db.add(timeline)

        db.commit()
        db.refresh(record)
        return serialize_attendance(record)

    @staticmethod
    def start_break(db: Session, employee_id: uuid.UUID, date_str: str, break_type: str, tenant_id: uuid.UUID) -> dict:
        record = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == date_str,
            Attendance.tenant_id == tenant_id,
            Attendance.deleted_at == None
        ).first()

        if not record:
            raise HTTPException(status_code=404, detail="Active check-in record not found for today.")

        if record.is_locked:
            raise HTTPException(status_code=400, detail="Attendance record is locked.")

        # Check if already in break
        active_break = db.query(AttendanceBreak).filter(
            AttendanceBreak.attendance_record_id == record.id,
            AttendanceBreak.end_time == None,
            AttendanceBreak.deleted_at == None
        ).first()
        if active_break:
            raise HTTPException(status_code=400, detail="An active break is already running.")

        now_time = datetime.now().strftime("%H:%M:%S")
        b = AttendanceBreak(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            break_type=break_type,
            start_time=now_time
        )
        db.add(b)
        db.flush()

        timeline = AttendanceTimeline(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            event_type="break_start",
            performed_by=record.employee.work_email if record.employee else "system",
            metadata_json={"time": now_time, "breakType": break_type}
        )
        db.add(timeline)
        db.commit()
        db.refresh(record)
        return serialize_attendance(record)

    @staticmethod
    def end_break(db: Session, employee_id: uuid.UUID, date_str: str, tenant_id: uuid.UUID) -> dict:
        record = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == date_str,
            Attendance.tenant_id == tenant_id,
            Attendance.deleted_at == None
        ).first()

        if not record:
            raise HTTPException(status_code=404, detail="Active check-in record not found.")

        if record.is_locked:
            raise HTTPException(status_code=400, detail="Attendance record is locked.")

        # Find active break
        b = db.query(AttendanceBreak).filter(
            AttendanceBreak.attendance_record_id == record.id,
            AttendanceBreak.end_time == None,
            AttendanceBreak.deleted_at == None
        ).first()
        if not b:
            raise HTTPException(status_code=400, detail="No active break session found.")

        now_time = datetime.now().strftime("%H:%M:%S")
        b.end_time = now_time
        
        # Calculate duration
        try:
            t1 = datetime.strptime(b.start_time, "%H:%M:%S")
            t2 = datetime.strptime(now_time, "%H:%M:%S")
            b.duration_minutes = int((t2 - t1).total_seconds() / 60.0)
        except Exception:
            b.duration_minutes = 0

        timeline = AttendanceTimeline(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            event_type="break_end",
            performed_by=record.employee.work_email if record.employee else "system",
            metadata_json={"time": now_time, "durationMinutes": b.duration_minutes}
        )
        db.add(timeline)
        db.commit()
        db.refresh(record)
        return serialize_attendance(record)

    @staticmethod
    def request_regularization(db: Session, employee_id: uuid.UUID, date_str: str, request_type: str, check_in: str, check_out: str, reason: str, tenant_id: uuid.UUID) -> dict:
        record = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == date_str,
            Attendance.tenant_id == tenant_id,
            Attendance.deleted_at == None
        ).first()

        if not record:
            # Create a placeholder absent record to attach regularization to
            emp_record = employee_repo.get_by_id(db, employee_id)
            if not emp_record:
                raise HTTPException(status_code=404, detail="Employee not found")
            record = Attendance(
                tenant_id=tenant_id,
                employee_id=employee_id,
                full_name=emp_record.full_name,
                date=date_str,
                status="absent",
                work_mode="onsite"
            )
            db.add(record)
            db.flush()

        if record.is_locked:
            raise HTTPException(status_code=400, detail="Cannot regularize a locked attendance record.")

        reg = AttendanceRegularization(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            request_type=request_type,
            requested_check_in=check_in,
            requested_check_out=check_out,
            reason=reason,
            status="pending"
        )
        db.add(reg)
        db.flush()

        timeline = AttendanceTimeline(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            event_type="regularization_request",
            performed_by=record.employee.work_email if record.employee else "system",
            metadata_json={
                "requestType": request_type,
                "requestedCheckIn": check_in,
                "requestedCheckOut": check_out,
                "reason": reason
            }
        )
        db.add(timeline)
        db.commit()
        db.refresh(record)
        return serialize_attendance(record)

    @staticmethod
    def approve_regularization(db: Session, reg_id: uuid.UUID, status: str, approved_by: str, comment: Optional[str], tenant_id: uuid.UUID) -> dict:
        reg = db.query(AttendanceRegularization).filter(
            AttendanceRegularization.id == reg_id,
            AttendanceRegularization.tenant_id == tenant_id
        ).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Regularization request not found.")

        if reg.status != "pending":
            raise HTTPException(status_code=400, detail="Regularization request has already been processed.")

        reg.status = status
        reg.approved_by = approved_by
        reg.approved_at = datetime.utcnow()
        reg.comments = comment

        record = reg.attendance
        if status == "approved" and record:
            if reg.requested_check_in:
                record.check_in = reg.requested_check_in
            if reg.requested_check_out:
                record.check_out = reg.requested_check_out
            
            # Recalculate hours
            if record.check_in and record.check_out:
                total_hours = calculate_hours_difference(record.check_in, record.check_out)
                break_mins = sum(b.duration_minutes or 0 for b in (record.breaks or []))
                actual_work = max(0.0, total_hours - (break_mins / 60.0))
                record.working_hours = round(actual_work, 2)

                min_hours = record.shift.min_working_hours if record.shift else 8.0
                if actual_work < (min_hours / 2.0):
                    record.status = "absent"
                elif actual_work < min_hours:
                    record.status = "half_day"
                else:
                    record.status = "present"
            else:
                record.status = "present"

        timeline = AttendanceTimeline(
            tenant_id=tenant_id,
            attendance_record_id=record.id,
            event_type=f"regularization_{status}",
            performed_by=approved_by,
            metadata_json={"status": status, "comments": comment}
        )
        db.add(timeline)
        db.commit()
        db.refresh(record)
        return serialize_attendance(record)

    @staticmethod
    def lock_attendance(db: Session, start_date: str, end_date: str, tenant_id: uuid.UUID) -> int:
        records = db.query(Attendance).filter(
            Attendance.tenant_id == tenant_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.deleted_at == None
        ).all()
        for r in records:
            r.is_locked = True
            
            # timeline lock log
            tl = AttendanceTimeline(
                tenant_id=tenant_id,
                attendance_record_id=r.id,
                event_type="lock",
                performed_by="system",
                metadata_json={"start": start_date, "end": end_date}
            )
            db.add(tl)
            
        db.commit()
        return len(records)

    @staticmethod
    def list_regularizations(db: Session, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> List[dict]:
        query = db.query(AttendanceRegularization).join(Attendance).filter(
            AttendanceRegularization.tenant_id == tenant_id,
            AttendanceRegularization.deleted_at == None
        )
        if user_role == "employee":
            query = query.filter(Attendance.employee_id == user_employee_id)
            
        requests = query.order_by(AttendanceRegularization.created_at.desc()).all()
        formatted = []
        for r in requests:
            formatted.append({
                "id": str(r.id),
                "recordId": str(r.attendance_record_id),
                "employeeName": r.attendance.full_name if r.attendance else "",
                "employeeCode": r.attendance.employee.employee_id if r.attendance and r.attendance.employee else "",
                "date": r.attendance.date if r.attendance else "",
                "requestType": r.request_type,
                "requestedCheckIn": r.requested_check_in,
                "requestedCheckOut": r.requested_check_out,
                "reason": r.reason,
                "status": r.status,
                "approvedBy": r.approved_by,
                "approvedAt": r.approved_at.isoformat() if r.approved_at else None,
                "comments": r.comments
            })
        return formatted
