from sqlalchemy import Column, String, JSON
from app.models.base import TenantBaseModel

class Onboarding(TenantBaseModel):
    __tablename__ = "onboardings"

    employee_id = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="in_progress", nullable=False) # in_progress, completed
    completed_steps = Column(JSON, default=list, nullable=False) # e.g. ["basic", "org", "docs", "payroll", "assets", "access"]
    checklist = Column(JSON, default=dict, nullable=False) # e.g. {"pan": false, "pf": false, "it": false, "em": false, "bg": false}
