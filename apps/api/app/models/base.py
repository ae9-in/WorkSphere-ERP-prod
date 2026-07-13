import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class BaseModel(Base):
    __abstract__ = True

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    created_by = Column(
        String,
        nullable=True
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    updated_by = Column(
        String,
        nullable=True
    )
    deleted_at = Column(
        DateTime,
        nullable=True
    )
    deleted_by = Column(
        String,
        nullable=True
    )

class TenantBaseModel(BaseModel):
    __abstract__ = True

    tenant_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
