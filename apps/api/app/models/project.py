import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, JSON, UniqueConstraint, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from app.models.base import TenantBaseModel, BaseModel

class Project(TenantBaseModel):
    __tablename__ = "projects"

    project_code    = Column(String, nullable=False)
    name            = Column(String, nullable=False)
    client          = Column(String, nullable=True)
    department      = Column(String, nullable=True)
    budget          = Column(Float, default=0.0, nullable=False)
    start_date      = Column(Date, nullable=False)
    end_date        = Column(Date, nullable=True)
    priority        = Column(String, default="medium", nullable=False)  # low, medium, high
    status          = Column(String, default="active", nullable=False)  # active, completed, delayed, cancelled
    description     = Column(Text, nullable=True)
    manager_id      = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    members         = Column(JSON, default=list, nullable=False)  # JSON list of employee UUIDs

    manager         = relationship("Employee")
    tasks           = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    milestones      = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "project_code", name="uq_tenant_project_code"),
    )

class Task(TenantBaseModel):
    __tablename__ = "project_tasks"

    name            = Column(String, nullable=False)
    description     = Column(Text, nullable=True)
    priority        = Column(String, default="medium", nullable=False)  # low, medium, high
    status          = Column(String, default="todo", nullable=False)  # backlog, todo, progress, review, testing, completed
    assignee_id     = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    reporter_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    project_id      = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    milestone_id    = Column(UUID(as_uuid=True), ForeignKey("project_milestones.id", ondelete="SET NULL"), nullable=True)
    estimated_hours = Column(Float, default=0.0, nullable=False)
    actual_hours    = Column(Float, default=0.0, nullable=False)
    due_date        = Column(Date, nullable=True)
    start_date      = Column(Date, nullable=True)

    project         = relationship("Project", back_populates="tasks")
    milestone       = relationship("Milestone", back_populates="tasks")
    assignee        = relationship("Employee")

    subtasks        = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    dependencies    = relationship("TaskDependency", foreign_keys="[TaskDependency.task_id]", back_populates="task", cascade="all, delete-orphan")

class Subtask(BaseModel):
    __tablename__ = "project_subtasks"

    task_id         = Column(UUID(as_uuid=True), ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=False)
    name            = Column(String, nullable=False)
    status          = Column(String, default="pending", nullable=False)  # pending, completed

    task            = relationship("Task", back_populates="subtasks")

class TaskDependency(BaseModel):
    __tablename__ = "project_task_dependencies"

    task_id             = Column(UUID(as_uuid=True), ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=False)
    depends_on_task_id  = Column(UUID(as_uuid=True), ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=False)

    task                = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    dependency          = relationship("Task", foreign_keys=[depends_on_task_id])

class Timesheet(TenantBaseModel):
    __tablename__ = "project_timesheets"

    employee_id     = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    project_id      = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id         = Column(UUID(as_uuid=True), ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=False)
    date            = Column(Date, nullable=False)
    hours_worked    = Column(Float, default=0.0, nullable=False)
    description     = Column(Text, nullable=True)
    billable        = Column(Boolean, default=True, nullable=False)
    billing_rate    = Column(Float, default=0.0, nullable=False)
    status          = Column(String, default="pending", nullable=False)  # pending, approved, rejected

    employee        = relationship("Employee")
    project         = relationship("Project")
    task            = relationship("Task")

class Milestone(TenantBaseModel):
    __tablename__ = "project_milestones"

    name            = Column(String, nullable=False)
    project_id      = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    description     = Column(Text, nullable=True)
    due_date        = Column(Date, nullable=False)
    status          = Column(String, default="pending", nullable=False)  # pending, completed
    completion_percentage = Column(Float, default=0.0, nullable=False)

    project         = relationship("Project", back_populates="milestones")
    tasks           = relationship("Task", back_populates="milestone")

class ProjectRisk(TenantBaseModel):
    __tablename__ = "project_risks"

    project_id      = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name            = Column(String, nullable=False)
    probability     = Column(String, default="medium", nullable=False)  # low, medium, high
    impact          = Column(String, default="medium", nullable=False)  # low, medium, high
    resolution_plan = Column(Text, nullable=True)
    status          = Column(String, default="open", nullable=False)  # open, resolved

    project         = relationship("Project")
