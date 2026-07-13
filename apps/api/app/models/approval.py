from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.models.base import TenantBaseModel

class Approval(TenantBaseModel):
    __tablename__ = "approvals"

    employee_id = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    type = Column(String, nullable=False) # Leave Request, Attendance Regularization, Expense Claim
    details = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    date_range = Column(String, nullable=True)
    amount = Column(String, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
