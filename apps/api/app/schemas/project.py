from pydantic import BaseModel
from typing import Optional, List, Any
from uuid import UUID

class ProjectCreateSchema(BaseModel):
    projectCode: str
    name: str
    client: Optional[str] = None
    department: Optional[str] = None
    budget: Optional[float] = 0.0
    startDate: str  # YYYY-MM-DD
    endDate: Optional[str] = None  # YYYY-MM-DD
    priority: Optional[str] = "medium"
    status: Optional[str] = "active"
    description: Optional[str] = None
    managerId: Optional[str] = None
    members: Optional[List[str]] = []

class TaskCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "todo"
    assigneeId: Optional[str] = None
    projectId: str
    milestoneId: Optional[str] = None
    estimatedHours: Optional[float] = 0.0
    dueDate: Optional[str] = None
    startDate: Optional[str] = None

class TaskStatusUpdateSchema(BaseModel):
    status: str

class TimesheetCreateSchema(BaseModel):
    projectId: str
    taskId: str
    date: str  # YYYY-MM-DD
    hoursWorked: float
    description: Optional[str] = None
    billable: Optional[bool] = True
    billingRate: Optional[float] = 0.0

class TimesheetApproveSchema(BaseModel):
    status: str  # approved, rejected

class MilestoneCreateSchema(BaseModel):
    name: str
    projectId: str
    description: Optional[str] = None
    dueDate: str  # YYYY-MM-DD
    completionPercentage: Optional[float] = 0.0

class RiskCreateSchema(BaseModel):
    projectId: str
    name: str
    probability: str  # low, medium, high
    impact: str  # low, medium, high
    resolutionPlan: Optional[str] = None
