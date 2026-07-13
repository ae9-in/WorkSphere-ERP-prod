from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.leave import LeaveRepository
from app.repositories.employee import EmployeeRepository
from app.models.leave import (
    LeaveType, LeaveBalance, LeaveApplication, LeaveApplicationComment,
    LeaveLedger, LeaveEncashment, LeaveCarryForward, LeaveTimeline
)
from app.models.employee import Employee
from app.models.user import User
from app.models.settings import HolidayCalendar
from app.models.attendance import Attendance
from app.models.workflow import WorkflowDefinition, WorkflowInstance, WorkflowInstanceStep
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.schemas.leave import LeaveTypeCreateSchema, LeaveApplyRequest

leave_repo = LeaveRepository()
employee_repo = EmployeeRepository()

def calculate_net_days(from_str: str, to_str: str, tenant_id: uuid.UUID, db: Session, sandwich: bool = False) -> float:
    from_date = datetime.strptime(from_str, "%Y-%m-%d")
    to_date = datetime.strptime(to_str, "%Y-%m-%d")
    
    if sandwich:
        # If sandwich leave rule applies, count all calendar days between dates
        return float((to_date - from_date).days + 1)
        
    cal = db.query(HolidayCalendar).filter(
        HolidayCalendar.tenant_id == tenant_id,
        HolidayCalendar.year == from_date.year
    ).first()
    
    holiday_dates = set()
    if cal:
        holiday_dates = {h.date.date() for h in cal.holidays}
        
    count = 0
    curr = from_date
    while curr <= to_date:
        is_weekend = curr.weekday() in [5, 6]
        is_holiday = curr.date() in holiday_dates
        
        if not is_weekend and not is_holiday:
            count += 1
        curr += timedelta(days=1)
        
    return float(count)

def serialize_leave_application(app: LeaveApplication) -> dict:
    return {
        "_id": str(app.id),
        "employeeId": app.employee.employee_id if app.employee else "",
        "employeeName": app.employee.full_name if app.employee else "",
        "leaveTypeId": {
            "_id": str(app.leave_type.id),
            "name": app.leave_type.name,
            "code": app.leave_type.code,
            "isPaid": app.leave_type.is_paid,
            "maxDays": app.leave_type.max_days,
            "requiresApproval": app.leave_type.requires_approval
        } if app.leave_type else None,
        "from": app.from_date.strftime("%Y-%m-%d") if app.from_date else None,
        "to": app.to_date.strftime("%Y-%m-%d") if app.to_date else None,
        "days": app.days,
        "lopDays": app.lop_days,
        "isSandwich": app.is_sandwich,
        "halfDay": app.half_day,
        "halfDayType": app.half_day_type,
        "reason": app.reason,
        "status": app.status,
        "actionedBy": str(app.actioned_by) if app.actioned_by else None,
        "actionedAt": app.actioned_at.strftime("%Y-%m-%d %H:%M:%S") if app.actioned_at else None,
        "comments": [{
            "userId": str(c.user_id),
            "userName": c.user_name,
            "comment": c.comment,
            "createdAt": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for c in app.comments] if app.comments else [],
        "timelines": [{
            "id": str(t.id),
            "eventType": t.event_type,
            "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "performedBy": t.performed_by,
            "metadataJson": t.metadata_json
        } for t in app.timelines] if app.timelines else [],
        "companyId": str(app.tenant_id)
    }

def serialize_leave_balance(bal: LeaveBalance) -> dict:
    return {
        "_id": str(bal.id),
        "employeeId": bal.employee.employee_id if bal.employee else "",
        "employeeName": bal.employee.full_name if bal.employee else "",
        "leaveTypeId": {
            "_id": str(bal.leave_type.id),
            "name": bal.leave_type.name,
            "code": bal.leave_type.code,
            "isPaid": bal.leave_type.is_paid
        } if bal.leave_type else None,
        "year": bal.year,
        "allocated": bal.allocated,
        "used": bal.used,
        "pending": bal.pending,
        "available": bal.available,
        "companyId": str(bal.tenant_id)
    }

class LeaveService:
    @staticmethod
    def create_leave_type(db: Session, payload: LeaveTypeCreateSchema, tenant_id: uuid.UUID) -> LeaveType:
        lt = LeaveType(
            tenant_id=tenant_id,
            name=payload.name,
            code=payload.code,
            is_paid=payload.is_paid,
            accrual_based=payload.accrual_based,
            max_days=payload.max_days,
            carry_forward=payload.carry_forward,
            requires_approval=payload.requires_approval,
            gender=payload.gender
        )
        db.add(lt)
        db.commit()
        db.refresh(lt)
        return lt

    @staticmethod
    def list_leave_types(db: Session, tenant_id: uuid.UUID) -> List[LeaveType]:
        return db.query(LeaveType).filter(LeaveType.tenant_id == tenant_id, LeaveType.deleted_at == None).all()

    @staticmethod
    def apply_leave(db: Session, payload: LeaveApplyRequest, user: User, tenant_id: uuid.UUID) -> dict:
        if user.role == "employee":
            emp_id = user.employee_id
        else:
            target_emp_str = payload.employeeId
            if not target_emp_str:
                raise HTTPException(status_code=400, detail="Employee ID context missing")
            try:
                emp_uuid = uuid.UUID(target_emp_str)
                emp = employee_repo.get_by_id(db, emp_uuid)
            except ValueError:
                emp = employee_repo.get_by_employee_id(db, target_emp_str, tenant_id)
            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")
            emp_id = emp.id
            
        emp_obj = employee_repo.get_by_id(db, emp_id)
        if not emp_obj:
            raise HTTPException(status_code=404, detail="Employee profile not found")

        leave_type_uuid = uuid.UUID(payload.leaveTypeId)
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_uuid, LeaveType.tenant_id == tenant_id, LeaveType.deleted_at == None).first()
        if not leave_type:
            raise HTTPException(status_code=404, detail="Leave type not found")
            
        # Detect sandwich rule: if leave spans over weekends/holidays, set sandwich to true
        net_working_days = calculate_net_days(payload.from_date, payload.to_date, tenant_id, db, sandwich=False)
        total_calendar_days = calculate_net_days(payload.from_date, payload.to_date, tenant_id, db, sandwich=True)
        is_sandwiched = total_calendar_days > net_working_days

        days = calculate_net_days(payload.from_date, payload.to_date, tenant_id, db, sandwich=is_sandwiched)
        if days == 0:
            raise HTTPException(status_code=400, detail="Applied dates correspond entirely to holidays or weekends")
            
        if payload.halfDay:
            days = days * 0.5
            
        year = datetime.strptime(payload.from_date, "%Y-%m-%d").year
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == emp_id,
            LeaveBalance.leave_type_id == leave_type_uuid,
            LeaveBalance.year == year,
            LeaveBalance.tenant_id == tenant_id,
            LeaveBalance.deleted_at == None
        ).first()
        
        if not balance:
            balance = LeaveBalance(
                tenant_id=tenant_id,
                employee_id=emp_id,
                leave_type_id=leave_type_uuid,
                year=year,
                allocated=leave_type.max_days,
                used=0.0,
                pending=0.0,
                available=float(leave_type.max_days)
            )
            db.add(balance)
            db.flush()

        lop_days_calculated = 0.0
        applied_days_on_balance = days
        
        # LOP detection: if balance is insufficient
        if balance.available < days:
            if not leave_type.is_paid or leave_type.code == "LOP":
                # Fully LOP
                lop_days_calculated = days
                applied_days_on_balance = 0.0
            else:
                # Partial LOP
                lop_days_calculated = days - balance.available
                applied_days_on_balance = balance.available
            
        app = LeaveApplication(
            tenant_id=tenant_id,
            employee_id=emp_id,
            leave_type_id=leave_type_uuid,
            from_date=datetime.strptime(payload.from_date, "%Y-%m-%d"),
            to_date=datetime.strptime(payload.to_date, "%Y-%m-%d"),
            days=applied_days_on_balance,
            lop_days=lop_days_calculated,
            is_sandwich=is_sandwiched,
            half_day=payload.halfDay,
            half_day_type=payload.halfDayType,
            reason=payload.reason,
            status="pending"
        )
        db.add(app)
        db.flush()

        # Update balance pending
        if balance and applied_days_on_balance > 0:
            balance.pending += applied_days_on_balance
            balance.available -= applied_days_on_balance

        # Log timeline event
        timeline = LeaveTimeline(
            tenant_id=tenant_id,
            leave_application_id=app.id,
            event_type="submitted",
            performed_by=user.email,
            metadata_json={"days": days, "lopDays": lop_days_calculated, "isSandwich": is_sandwiched}
        )
        db.add(timeline)
            
        workflow_def = db.query(WorkflowDefinition).filter(
            WorkflowDefinition.tenant_id == tenant_id,
            WorkflowDefinition.module == "leave",
            WorkflowDefinition.is_active == True,
            WorkflowDefinition.deleted_at == None
        ).first()
        
        if workflow_def:
            manager_name = emp_obj.reporting_manager_name if emp_obj else "admin"
            manager_user = db.query(User).filter(User.full_name == manager_name, User.company_id == tenant_id, User.deleted_at == None).first()
            manager_id = manager_user.id if manager_user else user.id
            
            instance = WorkflowInstance(
                tenant_id=tenant_id,
                definition_id=workflow_def.id,
                entity_type="LeaveApplication",
                entity_id=app.id,
                initiated_by=user.id,
                status="pending"
            )
            db.add(instance)
            db.flush()
            
            step = WorkflowInstanceStep(
                instance_id=instance.id,
                step_no=1,
                approver_id=manager_id,
                status="pending"
            )
            db.add(step)
            
            app.workflow_instance_id = instance.id
            
            notif = Notification(
                tenant_id=tenant_id,
                type="approval_request",
                title="Pending Leave Approval",
                message=f"{user.full_name} requested leave for {days} day(s) starting {payload.from_date}.",
                recipient_id=manager_id,
                url="/approvals"
            )
            db.add(notif)
        else:
            # Auto-approve
            app.status = "approved"
            if balance:
                balance.pending -= applied_days_on_balance
                balance.used += applied_days_on_balance
            
            # Sync to attendance
            LeaveService.sync_leave_to_attendance(db, app, tenant_id)
            # Log Ledger
            LeaveService.log_ledger_entry(
                db, emp_id, leave_type_uuid, "leave_taken",
                applied_days_on_balance, balance.available + applied_days_on_balance, balance.available,
                f"Approved leave taken from {payload.from_date} to {payload.to_date}", tenant_id
            )

        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=user.id,
            email=user.email,
            action="LEAVE_APPLICATION_APPLIED",
            details=f"Applied leave for {days} days (LOP: {lop_days_calculated}) starting {payload.from_date}"
        )
        db.add(audit)
        db.commit()
        db.refresh(app)
        return serialize_leave_application(app)

    @staticmethod
    def list_applications(db: Session, tenant_id: uuid.UUID, status: Optional[str], employee_id_str: Optional[str]) -> List[dict]:
        query = db.query(LeaveApplication).filter(LeaveApplication.tenant_id == tenant_id, LeaveApplication.deleted_at == None)
        
        if status:
            query = query.filter(LeaveApplication.status == status)
            
        if employee_id_str:
            try:
                emp_uuid = uuid.UUID(employee_id_str)
                query = query.filter(LeaveApplication.employee_id == emp_uuid)
            except ValueError:
                query = query.join(Employee).filter(Employee.employee_id == employee_id_str)
                
        apps = query.order_by(LeaveApplication.created_at.desc()).all()
        return [serialize_leave_application(a) for a in apps]

    @staticmethod
    def get_application(db: Session, app_id: str, tenant_id: uuid.UUID) -> dict:
        try:
            app_uuid = uuid.UUID(app_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid leave application ID format")
            
        app = db.query(LeaveApplication).filter(LeaveApplication.id == app_uuid, LeaveApplication.tenant_id == tenant_id, LeaveApplication.deleted_at == None).first()
        if not app:
            raise HTTPException(status_code=404, detail="Leave application not found")
        return serialize_leave_application(app)

    @staticmethod
    def action_leave_application(db: Session, app_id: str, approve: bool, comments_text: Optional[str], user: User, tenant_id: uuid.UUID) -> dict:
        try:
            app_uuid = uuid.UUID(app_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        app = db.query(LeaveApplication).filter(LeaveApplication.id == app_uuid, LeaveApplication.tenant_id == tenant_id, LeaveApplication.deleted_at == None).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
            
        if app.status != "pending":
            raise HTTPException(status_code=400, detail="Application is already finalized")
            
        year = app.from_date.year
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == app.employee_id,
            LeaveBalance.leave_type_id == app.leave_type_id,
            LeaveBalance.year == year,
            LeaveBalance.tenant_id == tenant_id,
            LeaveBalance.deleted_at == None
        ).first()
        
        if approve:
            app.status = "approved"
            if balance:
                balance.pending -= app.days
                balance.used += app.days
            
            # Sync to attendance
            LeaveService.sync_leave_to_attendance(db, app, tenant_id)

            # Log Ledger
            if balance and app.days > 0:
                LeaveService.log_ledger_entry(
                    db, app.employee_id, app.leave_type_id, "leave_taken",
                    app.days, balance.available + app.days, balance.available,
                    f"Approved leave taken from {app.from_date.strftime('%Y-%m-%d')} to {app.to_date.strftime('%Y-%m-%d')}", tenant_id
                )
        else:
            app.status = "rejected"
            if balance:
                balance.pending -= app.days
                balance.available += app.days

        app.actioned_by = user.id
        app.actioned_at = datetime.utcnow()
        
        if comments_text:
            comment = LeaveApplicationComment(
                leave_application_id=app.id,
                user_id=user.id,
                user_name=user.full_name,
                comment=comments_text
            )
            db.add(comment)
            
        # Log timeline event
        timeline = LeaveTimeline(
            tenant_id=tenant_id,
            leave_application_id=app.id,
            event_type="approved" if approve else "rejected",
            performed_by=user.email,
            metadata_json={"comments": comments_text}
        )
        db.add(timeline)

        notif = Notification(
            tenant_id=tenant_id,
            type="approval_granted" if approve else "approval_rejected",
            title="Leave Approved" if approve else "Leave Rejected",
            message=f"Your leave request for {app.days + app.lop_days} day(s) starting {app.from_date.strftime('%Y-%m-%d')} has been {'approved' if approve else 'rejected'}.",
            recipient_id=app.employee_id,
            url="/leave"
        )
        db.add(notif)
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=user.id,
            email=user.email,
            action="LEAVE_APPROVED" if approve else "LEAVE_REJECTED",
            details=f"Actioned leave application ID {app.id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(app)
        return serialize_leave_application(app)

    @staticmethod
    def withdraw_leave(db: Session, app_id: uuid.UUID, user: User, tenant_id: uuid.UUID) -> dict:
        app = db.query(LeaveApplication).filter(
            LeaveApplication.id == app_id,
            LeaveApplication.tenant_id == tenant_id
        ).first()
        if not app:
            raise HTTPException(status_code=404, detail="Leave application not found.")
        if app.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending leaves can be withdrawn.")

        app.status = "withdrawn"
        
        # Refund reserved balance
        year = app.from_date.year
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == app.employee_id,
            LeaveBalance.leave_type_id == app.leave_type_id,
            LeaveBalance.year == year,
            LeaveBalance.tenant_id == tenant_id
        ).first()
        if balance:
            balance.pending -= app.days
            balance.available += app.days

        timeline = LeaveTimeline(
            tenant_id=tenant_id,
            leave_application_id=app.id,
            event_type="withdrawn",
            performed_by=user.email
        )
        db.add(timeline)
        db.commit()
        db.refresh(app)
        return serialize_leave_application(app)

    @staticmethod
    def cancel_leave(db: Session, app_id: uuid.UUID, comment: Optional[str], user: User, tenant_id: uuid.UUID) -> dict:
        app = db.query(LeaveApplication).filter(
            LeaveApplication.id == app_id,
            LeaveApplication.tenant_id == tenant_id
        ).first()
        if not app:
            raise HTTPException(status_code=404, detail="Leave application not found.")
        if app.status != "approved":
            raise HTTPException(status_code=400, detail="Only approved leaves can be cancelled.")

        app.status = "cancelled"

        # Refund balances
        year = app.from_date.year
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == app.employee_id,
            LeaveBalance.leave_type_id == app.leave_type_id,
            LeaveBalance.year == year,
            LeaveBalance.tenant_id == tenant_id
        ).first()
        if balance:
            balance.used -= app.days
            balance.available += app.days

            # Log Ledger Adjustment
            LeaveService.log_ledger_entry(
                db, app.employee_id, app.leave_type_id, "adjustment",
                app.days, balance.available - app.days, balance.available,
                f"Cancelled approved leave. Balance refunded.", tenant_id
            )

        # Restore attendance back to present or absent (or delete the auto-sync status)
        curr = app.from_date
        while curr <= app.to_date:
            date_str = curr.strftime("%Y-%m-%d")
            att = db.query(Attendance).filter(
                Attendance.employee_id == app.employee_id,
                Attendance.date == date_str,
                Attendance.tenant_id == tenant_id
            ).first()
            if att:
                db.delete(att)
            curr += timedelta(days=1)

        timeline = LeaveTimeline(
            tenant_id=tenant_id,
            leave_application_id=app.id,
            event_type="cancelled",
            performed_by=user.email,
            metadata_json={"comments": comment}
        )
        db.add(timeline)
        db.commit()
        db.refresh(app)
        return serialize_leave_application(app)

    @staticmethod
    def get_balances(db: Session, employee_id_str: Optional[str], user: User, tenant_id: uuid.UUID) -> List[dict]:
        if employee_id_str:
            try:
                emp_uuid = uuid.UUID(employee_id_str)
                emp = employee_repo.get_by_id(db, emp_uuid)
            except ValueError:
                emp = employee_repo.get_by_employee_id(db, employee_id_str, tenant_id)
        else:
            emp = employee_repo.get_by_id(db, user.employee_id)
            
        if not emp or emp.tenant_id != tenant_id:
            return []
            
        year = datetime.utcnow().year
        balances = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == emp.id,
            LeaveBalance.tenant_id == tenant_id,
            LeaveBalance.year == year,
            LeaveBalance.deleted_at == None
        ).all()
        
        if len(balances) == 0:
            types = db.query(LeaveType).filter(LeaveType.tenant_id == tenant_id, LeaveType.deleted_at == None).all()
            for t in types:
                bal = LeaveBalance(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    leave_type_id=t.id,
                    year=year,
                    allocated=t.max_days,
                    used=0.0,
                    pending=0.0,
                    available=float(t.max_days)
                )
                db.add(bal)
                # Log Ledger
                LeaveService.log_ledger_entry(
                    db, emp.id, t.id, "opening",
                    t.max_days, 0.0, t.max_days,
                    "Opening leave allocation", tenant_id
                )
            db.commit()
            
            balances = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == emp.id,
                LeaveBalance.tenant_id == tenant_id,
                LeaveBalance.year == year,
                LeaveBalance.deleted_at == None
            ).all()
            
        return [serialize_leave_balance(b) for b in balances]

    @staticmethod
    def request_encashment(db: Session, employee_id: uuid.UUID, leave_type_id: uuid.UUID, days: float, reason: str, tenant_id: uuid.UUID) -> dict:
        year = datetime.utcnow().year
        bal = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == leave_type_id,
            LeaveBalance.year == year,
            LeaveBalance.tenant_id == tenant_id
        ).first()

        if not bal or bal.available < days:
            raise HTTPException(status_code=400, detail="Insufficient leave balance for encashment.")

        enc = LeaveEncashment(
            tenant_id=tenant_id,
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            days=days,
            amount=days * 1000.0, # Seed default amount calculation (e.g. ₹1000 per day encashed)
            status="pending",
            reason=reason
        )
        db.add(enc)
        db.commit()
        db.refresh(enc)
        return {
            "id": str(enc.id),
            "employeeName": enc.employee.full_name if enc.employee else "",
            "leaveTypeName": enc.leave_type.name if enc.leave_type else "",
            "days": enc.days,
            "amount": enc.amount,
            "status": enc.status,
            "reason": enc.reason
        }

    @staticmethod
    def list_encashments(db: Session, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> List[dict]:
        query = db.query(LeaveEncashment).filter(LeaveEncashment.tenant_id == tenant_id, LeaveEncashment.deleted_at == None)
        if user_role == "employee":
            query = query.filter(LeaveEncashment.employee_id == user_employee_id)
        encashments = query.order_by(LeaveEncashment.created_at.desc()).all()
        return [
            {
                "id": str(e.id),
                "employeeName": e.employee.full_name if e.employee else "",
                "employeeCode": e.employee.employee_id if e.employee else "",
                "leaveTypeName": e.leave_type.name if e.leave_type else "",
                "days": e.days,
                "amount": e.amount,
                "status": e.status,
                "reason": e.reason,
                "comments": e.comments
            } for e in encashments
        ]

    @staticmethod
    def approve_encashment(db: Session, encash_id: uuid.UUID, status: str, approved_by: str, comments: Optional[str], tenant_id: uuid.UUID) -> dict:
        enc = db.query(LeaveEncashment).filter(
            LeaveEncashment.id == encash_id,
            LeaveEncashment.tenant_id == tenant_id
        ).first()
        if not enc:
            raise HTTPException(status_code=404, detail="Encashment claim not found.")
        if enc.status != "pending":
            raise HTTPException(status_code=400, detail="Claim has already been processed.")

        enc.status = status
        enc.approved_by = approved_by
        enc.approved_at = datetime.utcnow()
        enc.comments = comments

        if status == "approved":
            year = datetime.utcnow().year
            bal = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == enc.employee_id,
                LeaveBalance.leave_type_id == enc.leave_type_id,
                LeaveBalance.year == year,
                LeaveBalance.tenant_id == tenant_id
            ).first()
            if bal:
                previous_bal = bal.available
                bal.available -= enc.days
                bal.used += enc.days
                # Log Ledger
                LeaveService.log_ledger_entry(
                    db, enc.employee_id, enc.leave_type_id, "encashment",
                    enc.days, previous_bal, bal.available,
                    f"Approved leave encashment of {enc.days} days", tenant_id
                )
        db.commit()
        return {"id": str(enc.id), "status": enc.status}

    @staticmethod
    def accrue_leaves(db: Session, employee_id: Optional[uuid.UUID], leave_type_id: Optional[uuid.UUID], tenant_id: uuid.UUID) -> int:
        query_employees = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.deleted_at == None)
        if employee_id:
            query_employees = query_employees.filter(Employee.id == employee_id)
        employees = query_employees.all()

        query_types = db.query(LeaveType).filter(LeaveType.tenant_id == tenant_id, LeaveType.accrual_based == True, LeaveType.deleted_at == None)
        if leave_type_id:
            query_types = query_types.filter(LeaveType.id == leave_type_id)
        types = query_types.all()

        year = datetime.utcnow().year
        accrued_count = 0

        for emp in employees:
            for t in types:
                bal = db.query(LeaveBalance).filter(
                    LeaveBalance.employee_id == emp.id,
                    LeaveBalance.leave_type_id == t.id,
                    LeaveBalance.year == year,
                    LeaveBalance.tenant_id == tenant_id
                ).first()

                accrual_days = round(t.max_days / 12.0, 2) # Assume monthly accrual: max_days / 12 months

                if not bal:
                    bal = LeaveBalance(
                        tenant_id=tenant_id,
                        employee_id=emp.id,
                        leave_type_id=t.id,
                        year=year,
                        allocated=t.max_days,
                        used=0.0,
                        pending=0.0,
                        available=accrual_days
                    )
                    db.add(bal)
                    db.flush()
                    previous_bal = 0.0
                else:
                    previous_bal = bal.available
                    bal.available += accrual_days
                
                LeaveService.log_ledger_entry(
                    db, emp.id, t.id, "accrual",
                    accrual_days, previous_bal, bal.available,
                    f"Monthly automated accrual credit", tenant_id
                )
                accrued_count += 1
        db.commit()
        return accrued_count

    @staticmethod
    def process_carry_forward(db: Session, source_year: int, target_year: int, tenant_id: uuid.UUID) -> int:
        balances = db.query(LeaveBalance).filter(
            LeaveBalance.tenant_id == tenant_id,
            LeaveBalance.year == source_year,
            LeaveBalance.deleted_at == None
        ).all()

        count = 0
        for sb in balances:
            lt = sb.leave_type
            if not lt or not lt.carry_forward or sb.available <= 0:
                continue

            max_carry = 10.0 # Default policy cap
            carried = min(sb.available, max_carry)
            expired = sb.available - carried

            # Create or update target year balance
            tb = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == sb.employee_id,
                LeaveBalance.leave_type_id == sb.leave_type_id,
                LeaveBalance.year == target_year,
                LeaveBalance.tenant_id == tenant_id
            ).first()

            if not tb:
                tb = LeaveBalance(
                    tenant_id=tenant_id,
                    employee_id=sb.employee_id,
                    leave_type_id=sb.leave_type_id,
                    year=target_year,
                    allocated=lt.max_days,
                    used=0.0,
                    pending=0.0,
                    available=carried
                )
                db.add(tb)
                db.flush()
                previous_target = 0.0
            else:
                previous_target = tb.available
                tb.available += carried

            # Log Carry Forward
            cf = LeaveCarryForward(
                tenant_id=tenant_id,
                employee_id=sb.employee_id,
                leave_type_id=sb.leave_type_id,
                source_year=source_year,
                target_year=target_year,
                days_carried=carried,
                days_expired=expired
            )
            db.add(cf)

            # Source Year Ledger: Expiry
            if expired > 0:
                LeaveService.log_ledger_entry(
                    db, sb.employee_id, sb.leave_type_id, "expiry",
                    expired, sb.available, sb.available - expired,
                    f"Expired unused balance for year {source_year}", tenant_id
                )
                sb.available -= expired

            # Target Year Ledger: Carry Forward
            LeaveService.log_ledger_entry(
                db, sb.employee_id, sb.leave_type_id, "carry_forward",
                carried, previous_target, tb.available,
                f"Carried forward from year {source_year}", tenant_id
            )
            count += 1
        db.commit()
        return count

    @staticmethod
    def list_ledgers(db: Session, employee_id: Optional[uuid.UUID], tenant_id: uuid.UUID) -> List[dict]:
        query = db.query(LeaveLedger).filter(
            LeaveLedger.tenant_id == tenant_id,
            LeaveLedger.deleted_at == None
        )
        if employee_id:
            query = query.filter(LeaveLedger.employee_id == employee_id)
        entries = query.order_by(LeaveLedger.transaction_date.desc()).all()
        return [
            {
                "id": str(e.id),
                "employeeName": e.employee.full_name if e.employee else "",
                "leaveTypeName": e.leave_type.name if e.leave_type else "",
                "transactionType": e.transaction_type,
                "days": e.days,
                "previousBalance": e.previous_balance,
                "newBalance": e.new_balance,
                "description": e.description,
                "transactionDate": e.transaction_date.strftime("%Y-%m-%d %H:%M:%S")
            } for e in entries
        ]

    @staticmethod
    def sync_leave_to_attendance(db: Session, app: LeaveApplication, tenant_id: uuid.UUID):
        curr = app.from_date
        while curr <= app.to_date:
            date_str = curr.strftime("%Y-%m-%d")
            # Get or create attendance
            att = db.query(Attendance).filter(
                Attendance.employee_id == app.employee_id,
                Attendance.date == date_str,
                Attendance.tenant_id == tenant_id
            ).first()
            if not att:
                att = Attendance(
                    tenant_id=tenant_id,
                    employee_id=app.employee_id,
                    full_name=app.employee.full_name if app.employee else "Unknown",
                    date=date_str,
                    status="leave",
                    work_mode="onsite",
                    working_hours=0.0
                )
                db.add(att)
            else:
                att.status = "leave"
                att.working_hours = 0.0
                att.check_in = None
                att.check_out = None
            curr += timedelta(days=1)

    @staticmethod
    def log_ledger_entry(db: Session, employee_id: uuid.UUID, leave_type_id: uuid.UUID, tx_type: str, days: float, prev_bal: float, new_bal: float, desc: str, tenant_id: uuid.UUID):
        entry = LeaveLedger(
            tenant_id=tenant_id,
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            transaction_type=tx_type,
            days=days,
            previous_balance=prev_bal,
            new_balance=new_bal,
            description=desc
        )
        db.add(entry)
