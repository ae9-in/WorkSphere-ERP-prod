from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.company import Company
from typing import List, Optional
import uuid

# OAuth2 scheme looking for Bearer token in Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

def get_current_user(db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized. No user session found.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = decode_token(token, is_refresh=False)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception
        
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_uuid, User.is_active == True).first()
    if not user:
        raise credentials_exception
        
    return user


def verify_tenant(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if user.role == "super_admin":
        return user
        
    if not user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bad Request. Missing tenant context."
        )
        
    # Check if the company/tenant exists and is active
    company = db.query(Company).filter(Company.id == user.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant company not found."
        )
        
    if company.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your company organization has been suspended. Please contact platform support."
        )
        
    return user


def get_user_roles(db: Session, user_id: uuid.UUID) -> List[str]:
    from app.models.rbac import UserRole, Role
    roles = db.query(Role.code).join(
        UserRole, UserRole.role_id == Role.id
    ).filter(
        UserRole.user_id == user_id,
        Role.deleted_at == None,
        UserRole.deleted_at == None
    ).all()
    return [r[0] for r in roles]


def get_user_permissions(db: Session, user_id: uuid.UUID) -> List[str]:
    from app.models.rbac import UserRole, RolePermission, Permission
    perms = db.query(Permission.code).join(
        RolePermission, RolePermission.permission_id == Permission.id
    ).join(
        UserRole, UserRole.role_id == RolePermission.role_id
    ).filter(
        UserRole.user_id == user_id,
        Permission.deleted_at == None,
        RolePermission.deleted_at == None,
        UserRole.deleted_at == None
    ).all()
    return [p[0] for p in perms]


class RequireRole:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        if user.role == "super_admin":
            return user
            
        user_roles = get_user_roles(db, user.id)
        if user.role:
            user_roles.append(user.role)
            
        has_role = False
        for r in self.allowed_roles:
            if r in user_roles:
                has_role = True
                break
                
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden. Role eligibility not met."
            )
        return user


class RequirePermission:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        if user.role == "super_admin":
            return user
            
        user_perms = get_user_permissions(db, user.id)
        if user.permissions:
            user_perms.extend(user.permissions)
            
        if "*" in user_perms:
            return user
            
        for req_perm in self.required_permissions:
            if req_perm in user_perms:
                continue
                
            req_parts = req_perm.split(":")
            if len(req_parts) > 1:
                req_domain = req_parts[0]
                has_wildcard = False
                for user_perm in user_perms:
                    user_parts = user_perm.split(":")
                    if len(user_parts) > 1 and user_parts[0] == req_domain and user_parts[1] == "*":
                        has_wildcard = True
                        break
                if has_wildcard:
                    continue
                    
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden. Insufficient permissions."
            )
        return user

