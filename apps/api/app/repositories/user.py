from app.repositories.base import BaseRepository
from app.models.user import User
from app.models.rbac import Role, Permission, UserRole, RolePermission
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip(), User.is_active == True).first()

    def get_roles(self, db: Session, user_id: UUID) -> List[Role]:
        return db.query(Role).join(UserRole, UserRole.role_id == Role.id).filter(UserRole.user_id == user_id).all()

    def get_permissions(self, db: Session, user_id: UUID) -> List[str]:
        # Fetch directly via roles mapping
        perms = db.query(Permission.code).join(RolePermission, RolePermission.permission_id == Permission.id)\
                  .join(UserRole, UserRole.role_id == RolePermission.role_id)\
                  .filter(UserRole.user_id == user_id).all()
        return [p[0] for p in perms]
