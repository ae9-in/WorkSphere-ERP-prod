from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.workflow import WorkflowRepository
from app.repositories.employee import EmployeeRepository
from app.models.workflow import WorkflowInstance, WorkflowInstanceStep, WorkflowDefinition
from app.models.leave import LeaveApplication, LeaveBalance
from app.models.employee import Employee
from app.models.user import User
from app.models.notification import Notification
from app.models.audit import AuditLog
from pydantic import BaseModel

employee_repo = EmployeeRepository()

class ActionRequest(BaseModel):
    action: str
    comments: Optional[str] = None

class DelegateRequest(BaseModel):
    toUserId: str

class WorkflowService:
    @staticmethod
    def get_pending_approvals(db: Session, user: User, tenant_id: uuid.UUID) -> List[dict]:
        user_uuids = [user.id]
        if user.employee_id:
            emp = employee_repo.get_by_employee_id(db, user.employee_id, tenant_id)
            if emp:
                user_uuids.append(emp.id)

        pending_steps = db.query(WorkflowInstanceStep).join(WorkflowInstance).filter(
            WorkflowInstance.tenant_id == tenant_id,
            WorkflowInstance.status == "pending",
            WorkflowInstanceStep.approver_id.in_(user_uuids),
            WorkflowInstanceStep.status == "pending",
            WorkflowInstance.deleted_at == None,
            WorkflowInstanceStep.deleted_at == None
        ).all()

        pending_list = []
        for step in pending_steps:
            inst = step.instance
            if inst.entity_type == "LeaveApplication":
                app = db.query(LeaveApplication).filter(LeaveApplication.id == inst.entity_id, LeaveApplication.deleted_at == None).first()
                if app:
                    pending_list.append({
                        "workflowInstanceId": str(inst.id),
                        "entityType": inst.entity_type,
                        "entityId": str(inst.entity_id),
                        "initiatedBy": str(inst.initiated_by),
                        "details": {
                            "id": str(app.id),
                            "employeeId": str(app.employee_id),
                            "leaveTypeId": str(app.leave_type_id),
                            "from": app.from_date.strftime("%Y-%m-%d") if app.from_date else None,
                            "to": app.to_date.strftime("%Y-%m-%d") if app.to_date else None,
                            "days": app.days,
                            "reason": app.reason,
                            "status": app.status
                        },
                        "createdAt": inst.created_at.isoformat() if inst.created_at else None
                    })
        return pending_list

    @staticmethod
    def action_workflow_instance(db: Session, instance_id: str, payload: ActionRequest, user: User, tenant_id: uuid.UUID) -> dict:
        try:
            inst_uuid = uuid.UUID(instance_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid instance ID format")

        instance = db.query(WorkflowInstance).filter(WorkflowInstance.id == inst_uuid, WorkflowInstance.tenant_id == tenant_id, WorkflowInstance.deleted_at == None).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Workflow instance not found")

        user_uuids = [user.id]
        if user.employee_id:
            emp = employee_repo.get_by_employee_id(db, user.employee_id, tenant_id)
            if emp:
                user_uuids.append(emp.id)

        step = db.query(WorkflowInstanceStep).filter(
            WorkflowInstanceStep.instance_id == instance.id,
            WorkflowInstanceStep.step_no == instance.current_step,
            WorkflowInstanceStep.status == "pending",
            WorkflowInstanceStep.deleted_at == None
        ).first()

        if not step or step.approver_id not in user_uuids:
            raise HTTPException(status_code=403, detail="Unauthorized action on this workflow step")

        now = datetime.utcnow()

        if payload.action == "reject":
            step.status = "rejected"
            step.actioned_at = now
            step.comments = payload.comments
            instance.status = "rejected"

            if instance.entity_type == "LeaveApplication":
                app = db.query(LeaveApplication).filter(LeaveApplication.id == instance.entity_id, LeaveApplication.deleted_at == None).first()
                if app:
                    app.status = "rejected"
                    
                    year = app.from_date.year
                    emp_record = employee_repo.get_by_id(db, app.employee_id)
                    emp_id_str = emp_record.employee_id if emp_record else None
                    if emp_id_str:
                        balance = db.query(LeaveBalance).filter(
                            LeaveBalance.employee_id == app.employee_id,
                            LeaveBalance.tenant_id == tenant_id,
                            LeaveBalance.leave_type_id == app.leave_type_id,
                            LeaveBalance.year == year,
                            LeaveBalance.deleted_at == None
                        ).first()
                        if balance:
                            balance.pending = max(0.0, balance.pending - app.days)
                            balance.available += app.days

                    notif = Notification(
                        tenant_id=tenant_id,
                        type="approval_rejected",
                        title="Leave Request Rejected",
                        message=f"Your leave request for {app.days} day(s) has been rejected by the manager.",
                        recipient_id=emp_id_str,
                        url="/leave"
                    )
                    db.add(notif)

            audit = AuditLog(
                tenant_id=tenant_id,
                user_id=user.id,
                email=user.email,
                action="WORKFLOW_REJECTED",
                details=f"Rejected workflow instance {instance_id}"
            )
            db.add(audit)
            db.commit()
            db.refresh(instance)
            return {"id": str(instance.id), "status": instance.status}

        # Approve
        step.status = "approved"
        step.actioned_at = now
        step.comments = payload.comments

        definition = db.query(WorkflowDefinition).filter(WorkflowDefinition.id == instance.definition_id, WorkflowDefinition.deleted_at == None).first()
        has_next = definition and len(definition.steps) > instance.current_step

        if has_next and definition:
            instance.current_step += 1
            next_def = next(s for s in definition.steps if s.step_no == instance.current_step)
            next_approver_id = uuid.UUID(next_def.approver_id) if next_def.approver_id else user.id

            next_step = WorkflowInstanceStep(
                instance_id=instance.id,
                step_no=instance.current_step,
                approver_id=next_approver_id,
                status="pending"
            )
            db.add(next_step)

            approver_emp = employee_repo.get_by_id(db, next_approver_id)
            approver_emp_id = approver_emp.employee_id if approver_emp else None
            
            notif = Notification(
                tenant_id=tenant_id,
                type="approval_request",
                title="Pending Approval Request",
                message="A workflow instance requires your approval review.",
                recipient_id=approver_emp_id,
                url="/approvals"
            )
            db.add(notif)
        else:
            instance.status = "approved"
            if instance.entity_type == "LeaveApplication":
                app = db.query(LeaveApplication).filter(LeaveApplication.id == instance.entity_id, LeaveApplication.deleted_at == None).first()
                if app:
                    app.status = "approved"
                    
                    year = app.from_date.year
                    emp_record = employee_repo.get_by_id(db, app.employee_id)
                    emp_id_str = emp_record.employee_id if emp_record else None
                    if emp_id_str:
                        balance = db.query(LeaveBalance).filter(
                            LeaveBalance.employee_id == app.employee_id,
                            LeaveBalance.tenant_id == tenant_id,
                            LeaveBalance.leave_type_id == app.leave_type_id,
                            LeaveBalance.year == year,
                            LeaveBalance.deleted_at == None
                        ).first()
                        if balance:
                            balance.pending = max(0.0, balance.pending - app.days)
                            balance.used += app.days

                    notif = Notification(
                        tenant_id=tenant_id,
                        type="approval_granted",
                        title="Leave Request Approved",
                        message=f"Your leave request for {app.days} day(s) has been fully approved!",
                        recipient_id=emp_id_str,
                        url="/leave"
                    )
                    db.add(notif)

        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=user.id,
            email=user.email,
            action="WORKFLOW_APPROVED",
            details=f"Approved step of workflow instance {instance_id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(instance)
        return {"id": str(instance.id), "status": instance.status}

    @staticmethod
    def delegate_workflow_instance(db: Session, instance_id: str, payload: DelegateRequest, user: User, tenant_id: uuid.UUID) -> dict:
        try:
            inst_uuid = uuid.UUID(instance_id)
            to_user_uuid = uuid.UUID(payload.toUserId)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID formats")

        instance = db.query(WorkflowInstance).filter(WorkflowInstance.id == inst_uuid, WorkflowInstance.tenant_id == tenant_id, WorkflowInstance.deleted_at == None).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Workflow instance not found")

        user_uuids = [user.id]
        if user.employee_id:
            emp = employee_repo.get_by_employee_id(db, user.employee_id, tenant_id)
            if emp:
                user_uuids.append(emp.id)

        step = db.query(WorkflowInstanceStep).filter(
            WorkflowInstanceStep.instance_id == instance.id,
            WorkflowInstanceStep.step_no == instance.current_step,
            WorkflowInstanceStep.status == "pending",
            WorkflowInstanceStep.deleted_at == None
        ).first()

        if not step or step.approver_id not in user_uuids:
            raise HTTPException(status_code=403, detail="Unauthorized delegation action")

        now = datetime.utcnow()
        step.status = "delegated"
        step.actioned_at = now
        step.comments = f"Delegated to {payload.toUserId}"

        next_step = WorkflowInstanceStep(
            instance_id=instance.id,
            step_no=instance.current_step,
            approver_id=to_user_uuid,
            status="pending"
        )
        db.add(next_step)

        delegation_emp = employee_repo.get_by_id(db, to_user_uuid)
        delegation_emp_id = delegation_emp.employee_id if delegation_emp else None

        notif = Notification(
            tenant_id=tenant_id,
            type="approval_request",
            title="Delegated Approval Request",
            message="A workflow approval task has been delegated to you.",
            recipient_id=delegation_emp_id,
            url="/approvals"
        )
        db.add(notif)

        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=user.id,
            email=user.email,
            action="WORKFLOW_DELEGATED",
            details=f"Delegated workflow {instance_id} to user {payload.toUserId}"
        )
        db.add(audit)
        db.commit()
        db.refresh(instance)
        return {"id": str(instance.id), "status": instance.status}
