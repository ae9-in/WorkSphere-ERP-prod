from sqlalchemy import Column, String, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import TenantBaseModel

class Notification(TenantBaseModel):
    __tablename__ = "notifications"

    type = Column(String, nullable=False) # approval_request, approval_granted, etc.
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    url = Column(String, nullable=True)
    recipient_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    actor = Column(JSON, nullable=True) # {name, photo}
