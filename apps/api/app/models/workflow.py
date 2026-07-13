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
