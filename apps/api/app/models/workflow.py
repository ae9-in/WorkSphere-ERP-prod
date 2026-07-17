from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import TenantBaseModel, BaseModel

class WorkflowDefinition(TenantBaseModel):
    __tablename__ = "workflow_definitions"

    module = Column(String, nullable=False) # leave, payroll, onboarding, offboarding, expense, asset
    trigger = Column(String, nullable=False) # e.g. submitted, initiated
    is_active = Column(Boolean, default=True, nullable=False)

    steps = relationship("WorkflowDefinitionStep", back_populates="definition", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "module", name="uq_tenant_workflow_module"),
    )


class WorkflowDefinitionStep(BaseModel):
    __tablename__ = "workflow_definition_steps"

    definition_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    step_no = Column(Integer, nullable=False)
    approver_type = Column(String, nullable=False) # role, reporting_manager, specific_user
    approver_role = Column(String, nullable=True)
    approver_id = Column(String, nullable=True)
    sla_hours = Column(Integer, default=48, nullable=False)
    escalate_to_role = Column(String, nullable=True)
    can_delegate = Column(Boolean, default=True, nullable=False)

    definition = relationship("WorkflowDefinition", back_populates="steps")


class WorkflowInstance(TenantBaseModel):
    __tablename__ = "workflow_instances"

    definition_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String, nullable=False) # LeaveApplication, PayrollRun, AssetAssignment, Regularization
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    initiated_by = Column(UUID(as_uuid=True), nullable=False)
    current_step = Column(Integer, default=1, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected, escalated, cancelled

    steps = relationship("WorkflowInstanceStep", back_populates="instance", cascade="all, delete-orphan")


class WorkflowInstanceStep(BaseModel):
    __tablename__ = "workflow_instance_steps"

    instance_id = Column(UUID(as_uuid=True), ForeignKey("workflow_instances.id", ondelete="CASCADE"), nullable=False, index=True)
    step_no = Column(Integer, nullable=False)
    approver_id = Column(UUID(as_uuid=True), nullable=True) # resolved user ID
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected, escalated, delegated
    actioned_at = Column(DateTime, nullable=True)
    comments = Column(String, nullable=True)
    attachments = Column(JSON, default=list, nullable=True) # Array of strings

    instance = relationship("WorkflowInstance", back_populates="steps")


class WorkflowAutomation(TenantBaseModel):
    __tablename__ = "workflow_automations"

    name            = Column(String, nullable=False)
    description     = Column(String, nullable=True)
    trigger_type    = Column(String, nullable=False) # e.g. employee_created, leave_applied, cron_schedule
    trigger_config  = Column(JSON, default=dict, nullable=False) # trigger parameters (cron, conditions)
    is_active       = Column(Boolean, default=True, nullable=False)
    nodes           = Column(JSON, default=list, nullable=False) # JSON list of visual node details
    connections     = Column(JSON, default=list, nullable=False) # JSON list of connection wires

    executions      = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowExecution(TenantBaseModel):
    __tablename__ = "workflow_executions"

    workflow_id     = Column(UUID(as_uuid=True), ForeignKey("workflow_automations.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at    = Column(DateTime, nullable=True)
    status          = Column(String, default="running", nullable=False) # running, completed, failed, paused, approval_pending
    variables       = Column(JSON, default=dict, nullable=False) # variable values for this run

    workflow        = relationship("WorkflowAutomation", back_populates="executions")
    logs            = relationship("WorkflowExecutionLog", back_populates="execution", cascade="all, delete-orphan")


class WorkflowExecutionLog(BaseModel):
    __tablename__ = "workflow_execution_logs"

    execution_id    = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id         = Column(String, nullable=False)
    node_type       = Column(String, nullable=False) # trigger, action, condition, delay, ai
    step_no         = Column(Integer, nullable=False)
    status          = Column(String, nullable=False) # success, failed
    message         = Column(String, nullable=True)
    input_data      = Column(JSON, default=dict, nullable=True)
    output_data     = Column(JSON, default=dict, nullable=True)

    execution       = relationship("WorkflowExecution", back_populates="logs")

