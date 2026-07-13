from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import TenantBaseModel

class AuditLog(TenantBaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    email = Column(String, nullable=False)
    action = Column(String, nullable=False, index=True) # e.g. 'EMPLOYEE_ONBOARDED'
    details = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
