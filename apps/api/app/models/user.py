from sqlalchemy import Column, String, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="employee", nullable=False)
    permissions = Column(JSON, default=list, nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String, default="", nullable=False)
    photo = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
