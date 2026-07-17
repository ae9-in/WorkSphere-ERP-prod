from pydantic import BaseModel, EmailStr
from typing import Optional, List

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    portal: Optional[str] = None

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    companyName: str
    email: EmailStr
    phone: Optional[str] = None
    companySize: Optional[str] = None
    country: Optional[str] = None
    password: str
    workspaceSlug: Optional[str] = None
    industry: Optional[str] = None
    roleDept: Optional[str] = None

class UserInfo(BaseModel):
    userId: str
    employeeId: Optional[str] = None
    companyId: Optional[str] = None
    companySlug: Optional[str] = None
    role: str
    permissions: List[str]
    email: EmailStr
    fullName: str
    photo: Optional[str] = None
    sessionId: str

class LoginResponseData(BaseModel):
    accessToken: str
    user: UserInfo

class LoginResponse(BaseModel):
    success: bool
    data: LoginResponseData

class UserResponse(BaseModel):
    success: bool
    data: UserInfo

class GeneralResponse(BaseModel):
    success: bool
    message: str
