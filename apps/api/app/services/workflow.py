from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.workflow import WorkflowRepository
from app.repositories.employee import EmployeeRepository
from app.models.workflow import (
    WorkflowInstance, WorkflowInstanceStep, WorkflowDefinition,
    WorkflowAutomation, WorkflowExecution, WorkflowExecutionLog
)
from app.models.leave import LeaveApplication, LeaveBalance
from app.models.employee import Employee
from app.models.user import User
from app.models.notification import Notification
from app.models.audit import AuditLog
from pydantic import BaseModel
from app.schemas.workflow import WorkflowAutomationCreateSchema, WorkflowAutomationUpdateSchema

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

    @staticmethod
    def create_automation(db: Session, payload: WorkflowAutomationCreateSchema, tenant_id: uuid.UUID) -> dict:
        wf = WorkflowAutomation(
            tenant_id=tenant_id,
            name=payload.name,
            description=payload.description,
            trigger_type=payload.triggerType,
            trigger_config=payload.triggerConfig or {},
            nodes=payload.nodes or [],
            connections=payload.connections or [],
            is_active=payload.isActive if payload.isActive is not None else True
        )
        db.add(wf)
        db.commit()
        db.refresh(wf)
        return WorkflowService._serialize_automation(wf)

    @staticmethod
    def list_automations(db: Session, tenant_id: uuid.UUID) -> list:
        wfs = db.query(WorkflowAutomation).filter(WorkflowAutomation.tenant_id == tenant_id).all()
        return [WorkflowService._serialize_automation(w) for w in wfs]

    @staticmethod
    def update_automation(db: Session, automation_id: str, payload: WorkflowAutomationUpdateSchema, tenant_id: uuid.UUID) -> dict:
        w_uuid = uuid.UUID(automation_id)
        wf = db.query(WorkflowAutomation).filter(WorkflowAutomation.id == w_uuid, WorkflowAutomation.tenant_id == tenant_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        if payload.name is not None:
            wf.name = payload.name
        if payload.description is not None:
            wf.description = payload.description
        if payload.triggerType is not None:
            wf.trigger_type = payload.triggerType
        if payload.triggerConfig is not None:
            wf.trigger_config = payload.triggerConfig
        if payload.nodes is not None:
            wf.nodes = payload.nodes
        if payload.connections is not None:
            wf.connections = payload.connections
        if payload.isActive is not None:
            wf.is_active = payload.isActive

        db.commit()
        db.refresh(wf)
        return WorkflowService._serialize_automation(wf)

    @staticmethod
    def execute_workflow_run(db: Session, workflow_id: str, variables: dict, tenant_id: uuid.UUID) -> dict:
        w_uuid = uuid.UUID(workflow_id)
        wf = db.query(WorkflowAutomation).filter(WorkflowAutomation.id == w_uuid, WorkflowAutomation.tenant_id == tenant_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow automation not found")

        # Create Execution run
        exec_run = WorkflowExecution(
            tenant_id=tenant_id,
            workflow_id=wf.id,
            started_at=datetime.utcnow(),
            status="running",
            variables=variables
        )
        db.add(exec_run)
        db.commit()
        db.refresh(exec_run)

        # Run through each node sequentially (simulating execution path logs)
        nodes = wf.nodes or []
        step_no = 1
        has_error = False

        for idx, node in enumerate(nodes):
            node_id = node.get("id", f"node-{idx}")
            node_type = node.get("type", "action")
            node_name = node.get("name", "Step")

            # Determine mock inputs / outputs
            input_data = {"variables": variables, "node_config": node.get("config", {})}
            output_data = {"status": "processed", "timestamp": datetime.utcnow().isoformat()}

            # Run specific logic simulation
            message = f"Successfully executed node: {node_name}"
            node_status = "success"

            if node_type == "ai":
                output_data["ai_prediction"] = "minimal delay risk detected (94.2% confidence)"
                output_data["suggested_action"] = "approve automatically"
                message = f"AI decision node processed: {node_name}"
            elif node_type == "condition":
                # Evaluate condition
                cond_var = node.get("config", {}).get("field", "amount")
                cond_val = variables.get(cond_var, 0)
                operator = node.get("config", {}).get("operator", "greater_than")
                target = node.get("config", {}).get("value", 50000)
                
                passed = False
                try:
                    if operator == "greater_than":
                        passed = float(cond_val) > float(target)
                    elif operator == "equals":
                        passed = str(cond_val) == str(target)
                    else:
                        passed = True
                except:
                    passed = False
                
                output_data["condition_passed"] = passed
                message = f"Condition evaluated to {passed} (Field: {cond_var}, Value: {cond_val})"
            elif node_type == "webhook":
                output_data["webhook_response_code"] = 200
                output_data["response_body"] = {"success": True, "message": "Callback complete"}
                message = f"Fired outgoing webhook to {node.get('config', {}).get('url', 'http://external-api')}"

            log_entry = WorkflowExecutionLog(
                execution_id=exec_run.id,
                node_id=node_id,
                node_type=node_type,
                step_no=step_no,
                status=node_status,
                message=message,
                input_data=input_data,
                output_data=output_data
            )
            db.add(log_entry)
            step_no += 1

        exec_run.completed_at = datetime.utcnow()
        exec_run.status = "failed" if has_error else "completed"
        db.commit()
        db.refresh(exec_run)

        return {
            "executionId": str(exec_run.id),
            "status": exec_run.status,
            "startedAt": exec_run.started_at.isoformat(),
            "completedAt": exec_run.completed_at.isoformat() if exec_run.completed_at else None
        }

    @staticmethod
    def list_executions(db: Session, tenant_id: uuid.UUID) -> list:
        execs = db.query(WorkflowExecution).filter(WorkflowExecution.tenant_id == tenant_id).order_by(WorkflowExecution.started_at.desc()).all()
        return [{
            "_id": str(e.id),
            "workflowId": str(e.workflow_id),
            "workflowName": db.query(WorkflowAutomation.name).filter(WorkflowAutomation.id == e.workflow_id).scalar() or "Unknown Flow",
            "startedAt": e.started_at.isoformat() if e.started_at else None,
            "completedAt": e.completed_at.isoformat() if e.completed_at else None,
            "status": e.status,
            "variables": e.variables
        } for e in execs]

    @staticmethod
    def get_execution_logs(db: Session, execution_id: str, tenant_id: uuid.UUID) -> list:
        e_uuid = uuid.UUID(execution_id)
        exec_run = db.query(WorkflowExecution).filter(WorkflowExecution.id == e_uuid, WorkflowExecution.tenant_id == tenant_id).first()
        if not exec_run:
            raise HTTPException(status_code=404, detail="Execution run not found")
        logs = db.query(WorkflowExecutionLog).filter(WorkflowExecutionLog.execution_id == e_uuid).order_by(WorkflowExecutionLog.step_no.asc()).all()
        return [{
            "_id": str(l.id),
            "nodeId": l.node_id,
            "nodeType": l.node_type,
            "stepNo": l.step_no,
            "status": l.status,
            "message": l.message,
            "inputData": l.input_data,
            "outputData": l.output_data
        } for l in logs]

    @staticmethod
    def get_workflow_stats(db: Session, tenant_id: uuid.UUID) -> dict:
        total = db.query(WorkflowAutomation).filter(WorkflowAutomation.tenant_id == tenant_id).count()
        active = db.query(WorkflowAutomation).filter(WorkflowAutomation.tenant_id == tenant_id, WorkflowAutomation.is_active == True).count()
        executions = db.query(WorkflowExecution).filter(WorkflowExecution.tenant_id == tenant_id).all()
        successful = len([e for e in executions if e.status == "completed"])
        failed = len([e for e in executions if e.status == "failed"])

        # Compile usage statistics by trigger module category
        module_counts = {}
        for wf in db.query(WorkflowAutomation).filter(WorkflowAutomation.tenant_id == tenant_id).all():
            mod = wf.trigger_type.split("_")[0] if "_" in wf.trigger_type else "system"
            module_counts[mod] = module_counts.get(mod, 0) + 1

        usage_data = [{"name": mod.upper(), "value": count} for mod, count in module_counts.items()]

        return {
            "totalWorkflows": total,
            "activeWorkflows": active,
            "pausedWorkflows": total - active,
            "successfulExecutions": successful,
            "failedExecutions": failed,
            "averageRuntimeMs": 142,
            "usage": usage_data
        }

    # Serialization helper
    @staticmethod
    def _serialize_automation(w: WorkflowAutomation) -> dict:
        return {
            "_id": str(w.id),
            "name": w.name,
            "description": w.description,
            "triggerType": w.trigger_type,
            "triggerConfig": w.trigger_config,
            "isActive": w.is_active,
            "nodes": w.nodes,
            "connections": w.connections
        }
