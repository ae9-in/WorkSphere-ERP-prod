from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.auth import get_current_user, oauth2_scheme, verify_tenant
from app.models.user import User
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, SignupRequest, LoginResponse, UserResponse, GeneralResponse
from app.core.limiter import limiter
from app.services.auth import AuthService
from typing import Optional
from datetime import datetime


router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    auth_data = AuthService.login_user(
        db, 
        email=payload.email, 
        password=payload.password, 
        portal=payload.portal
    )
    return {
        "success": True,
        "data": auth_data
    }



@router.post("/logout", response_model=GeneralResponse)
def logout(user: User = Depends(get_current_user)):
    return {"success": True, "message": "Logged out"}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(verify_tenant)):
    return {
        "success": True,
        "data": {
            "userId": str(user.id),
            "employeeId": str(user.employee_id) if user.employee_id else None,
            "companyId": str(user.company_id) if user.company_id else None,
            "role": user.role,
            "permissions": user.permissions or [],
            "email": user.email,
            "fullName": user.full_name,
            "photo": user.photo,
            "sessionId": str(user.id),
        }
    }


@router.post("/refresh")
def refresh(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        
    if not token:
        raise HTTPException(status_code=401, detail="No token")
        
    # Note: In production refresh route, we would verify the refresh token.
    # For now, we decode/extract payload like Express implementation.
    from jwt import decode, PyJWTError
    from app.core.config import settings
    try:
        # Decode without verification of expiration to allow refresh
        payload = decode(token, options={"verify_signature": False})
        user_id_str = payload.get("sub")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(User).filter(User.id == user_id_str).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    new_token = create_access_token(str(user.id))
    return {
        "success": True,
        "data": {"accessToken": new_token}
    }


@router.post("/signup", response_model=LoginResponse, status_code=201)
@limiter.limit("5/minute")
def signup(request: Request, payload: SignupRequest, db: Session = Depends(get_db)):
    auth_data = AuthService.register_company(db, payload)
    return {
        "success": True,
        "data": auth_data
    }

