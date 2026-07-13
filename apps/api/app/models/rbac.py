from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, TenantBaseModel

class Permission(BaseModel):
    __tablename__ = "permissions"

    code = Column(String, unique=True, index=True, nullable=False) # e.g. 'employee:create'
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

class Role(TenantBaseModel):
    __tablename__ = "roles"

    name = Column(String, nullable=False) # e.g. 'HR Manager'
    code = Column(String, nullable=False) # e.g. 'hr_manager'
    description = Column(String, nullable=True)

    permissions = relationship("Permission", secondary="role_permissions", backref="roles")

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_role_code"),
    )

class RolePermission(BaseModel):
    __tablename__ = "role_permissions"

    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, primary_key=True)

class UserRole(BaseModel):
    __tablename__ = "user_roles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, primary_key=True)
