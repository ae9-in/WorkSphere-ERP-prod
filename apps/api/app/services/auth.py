from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import Any
import re
import uuid


from app.repositories.user import UserRepository
from app.repositories.employee import EmployeeRepository
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token

user_repo = UserRepository()
employee_repo = EmployeeRepository()

class AuthService:
    @staticmethod
    def login_user(db: Session, email: str, password: str, portal: str = None) -> dict:
        user = user_repo.get_by_email(db, email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Portal checks
        if portal:
            if portal == "super_admin":
                if user.role != "super_admin":
                    raise HTTPException(status_code=401, detail="Access denied. Please use the HR Admin or Employee login portal.")
            elif portal == "employee":
                if user.role != "employee":
                    raise HTTPException(status_code=401, detail="Access denied. Please use the HR Admin portal.")
            elif portal == "tenant_admin":
                if user.role == "super_admin":
                    raise HTTPException(status_code=401, detail="Access denied. Please use the Super Admin portal.")
                if user.role == "employee":
                    raise HTTPException(status_code=401, detail="Access denied. Please use the Employee portal.")

        # Tenant verification
        if user.role != "super_admin" and user.company_id:
            company = db.query(Company).filter(Company.id == user.company_id).first()
            if company and company.status == "suspended":
                raise HTTPException(status_code=403, detail="Your organization has been suspended. Please contact platform support.")

        access_token = create_access_token(str(user.id))
        return {
            "accessToken": access_token,
            "user": {
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

    @staticmethod
    def register_company(db: Session, payload: Any) -> dict:
        email_clean = payload.email.lower().strip()
        
        # Check existing user
        existing_user = user_repo.get_by_email(db, email_clean)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        slug = payload.workspaceSlug
        if not slug:
            slug = payload.companyName.lower()
            slug = re.sub(r'\s+', '-', slug)
            slug = re.sub(r'[^a-z0-9-]', '', slug)
            
        existing_company = db.query(Company).filter(Company.slug == slug).first()
        if existing_company:
            raise HTTPException(status_code=400, detail="Workspace URL slug is already taken")
            
        # 1. Create company
        company = Company(
            name=payload.companyName,
            slug=slug,
            status="active",
            industry=payload.industry,
            size=payload.companySize,
            country=payload.country,
            subscription_plan="free",
            subscription_status="active",
        )
        db.add(company)
        db.flush()
        
        # 2. Assign Employee ID
        emp_count = db.query(Employee).count()
        emp_id_str = f"EMP{str(emp_count + 1).zfill(3)}"
        
        # 3. Create employee
        employee = Employee(
            tenant_id=company.id,
            employee_id=emp_id_str,
            full_name=f"{payload.firstName} {payload.lastName}",
            first_name=payload.firstName,
            last_name=payload.lastName,
            display_name=f"{payload.firstName} {payload.lastName}",
            personal_email=email_clean,
            personal_phone=payload.phone,
            nationality="Indian",
            work_email=email_clean,
            work_phone=payload.phone,
            employee_type="full_time",
            date_of_joining=datetime.utcnow().strftime("%Y-%m-%d"),
            status="active",
            department_name=payload.roleDept or "Management",
            designation_name="Company Admin / Founder",
            work_mode="hybrid",
            location_name=payload.country or "India",
            ctc=0.0,
            basic_percent=40.0,
            currency="INR",
            salary_effective_date=datetime.utcnow().strftime("%Y-%m-%d"),
            payment_mode="bank_transfer"
        )
        db.add(employee)
        db.flush()
        
        # 4. Create User
        password_hash = get_password_hash(payload.password)
        user = User(
            email=email_clean,
            password_hash=password_hash,
            full_name=f"{payload.firstName} {payload.lastName}",
            role="hr_head",
            permissions=[
                "employee:*", "onboarding:*", "offboarding:*", "payroll:*",
                "attendance:*", "reports:*", "documents:*", "workflow:*"
            ],
            employee_id=employee.id,
            company_id=company.id,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        access_token = create_access_token(str(user.id))
        return {
            "accessToken": access_token,
            "user": {
                "userId": str(user.id),
                "employeeId": emp_id_str,
                "companyId": slug,
                "role": user.role,
                "permissions": user.permissions or [],
                "email": user.email,
                "fullName": user.full_name,
                "photo": user.photo,
                "sessionId": str(user.id),
            }
        }
