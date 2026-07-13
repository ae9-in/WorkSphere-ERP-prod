from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.models.base import TenantBaseModel

class DocumentModel(TenantBaseModel):
    __tablename__ = "documents"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    category = Column(String, nullable=False) # employee, company, policy, payslip, offer, other
    type = Column(String, nullable=False) # e.g. pdf, png
    name = Column(String, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    url = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    is_expired = Column(Boolean, default=False, nullable=False)
    uploaded_by = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, verified, rejected
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    access_roles = Column(JSON, default=list, nullable=True) # e.g. ['employee', 'hr_head', 'company_admin']
