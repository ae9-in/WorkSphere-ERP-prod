from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.core.security import get_password_hash
from app.models.user import User
from app.models.employee import Employee
from app.models.onboarding import Onboarding
from app.models.asset import AssetAssignment
from app.models.document import DocumentModel
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.payroll import SalaryStructure
from app.schemas.auth import GeneralResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

class BasicInfo(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: str
    displayName: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    profilePhoto: Optional[str] = None
    fatherName: Optional[str] = None
    aadhaar: Optional[str] = None
    pan: Optional[str] = None

class OrgInfo(BaseModel):
    branch: str
    department: str
    designation: str
    dateOfJoining: str
    employmentType: Optional[str] = None
    workLocation: Optional[str] = None
    reportingManager: Optional[str] = None

class DocumentItem(BaseModel):
    documentType: str
    fileName: str
    fileSize: int

class PayrollInfo(BaseModel):
    ctc: float
    bankName: str
    accountNumber: str
    ifsc: str
    uan: Optional[str] = None
    pfEnabled: Optional[bool] = True
    esiEnabled: Optional[bool] = False
    professionalTax: Optional[bool] = True
    tds: Optional[float] = 0.0
    payrollGroup: Optional[str] = "Standard"

class AssetItem(BaseModel):
    assetType: str
    assetName: str
    serialNumber: str

class SystemAccess(BaseModel):
    role: str

class OnboardingRequest(BaseModel):
    basic: BasicInfo
    org: OrgInfo
    documents: Optional[List[DocumentItem]] = None
    payroll: PayrollInfo
    assets: Optional[List[AssetItem]] = None
    systemAccess: SystemAccess

@router.post("/new", status_code=status.HTTP_201_CREATED)
def create_onboarding_workflow(payload: OnboardingRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Active session required.")

    # 1. Duplicate email check
    email_lower = payload.basic.email.lower()
    existing_user = db.query(User).filter(User.email == email_lower).first()
    existing_emp = db.query(Employee).filter(Employee.work_email == email_lower, Employee.tenant_id == tenant_id).first()
    
    if existing_user or existing_emp:
        raise HTTPException(status_code=400, detail="An account or employee with this email is already registered.")

    # 2. CTC validation
    if payload.payroll.ctc <= 0:
        raise HTTPException(status_code=400, detail="Salary CTC must be a positive number.")

    # 3. Joining date check (not in past)
    today = datetime.utcnow().date()
    try:
        joining_date = datetime.strptime(payload.org.date_of_joining if hasattr(payload.org, "date_of_joining") else payload.org.dateOfJoining, "%Y-%m-%d").date()
        if joining_date < today:
            raise HTTPException(status_code=400, detail="Past joining dates are not permitted. Please select today or a future date.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        # If parsing fails, fall back

    # 4. Generate Employee ID
    count = db.query(Employee).count()
    emp_id = f"EMP{str(count + 1).zfill(3)}"
    full_name = f"{payload.basic.firstName} {payload.basic.lastName}".strip()

    # 5. Create Employee
    employee = Employee(
        tenant_id=tenant_id,
        employee_id=emp_id,
        full_name=full_name,
        first_name=payload.basic.firstName,
        last_name=payload.basic.lastName,
        display_name=payload.basic.displayName or full_name,
        date_of_birth=payload.basic.dateOfBirth,
        gender=payload.basic.gender or "other",
        photo=payload.basic.profilePhoto,
        father_name=payload.basic.fatherName,
        pan_number=payload.basic.pan,
        aadhaar_number=payload.basic.aadhaar,
        work_email=email_lower,
        work_phone=payload.basic.phone,
        employee_type=payload.org.employmentType or "full_time",
        date_of_joining=payload.org.dateOfJoining,
        status="active",
        department_name=payload.org.department,
        designation_name=payload.org.designation,
        location_name=payload.org.workLocation or payload.org.branch,
        reporting_manager_name=payload.org.reportingManager or "HR Head",
        ctc=payload.payroll.ctc,
        basic_percent=40.0,
        currency="INR",
        salary_effective_date=payload.org.dateOfJoining,
        payment_mode="bank_transfer"
    )
    db.add(employee)
    db.flush()

    # 6. Create User Login
    temp_password = f"Welcome@{emp_id}"
    pwd_hash = get_password_hash(temp_password)
    new_user = User(
        company_id=tenant_id,
        email=email_lower,
        password_hash=pwd_hash,
        full_name=full_name,
        role="employee",
        permissions=["dashboard:read", "attendance:read", "leave:read", "profile:read", "payslips:read", "documents:read"],
        employee_id=employee.id,
        is_active=True
    )
    db.add(new_user)

    # 7. Create Documents
    if payload.documents:
        for doc in payload.documents:
            new_doc = DocumentModel(
                tenant_id=tenant_id,
                employee_id=employee.id,
                category="employee",
                type=doc.fileName.split(".")[-1] if "." in doc.fileName else "pdf",
                name=doc.fileName,
                url="https://cloudinary.com/placeholder-doc.pdf",
                size=doc.fileSize,
                mime_type="application/pdf",
                uploaded_by=str(user.id),
                status="pending"
            )
            db.add(new_doc)

    # 8. Create Asset Assignments
    if payload.assets:
        for asset in payload.assets:
            new_asset = AssetAssignment(
                tenant_id=tenant_id,
                employee_id=employee.id,
                asset_type=asset.assetType,
                asset_name=asset.assetName,
                serial_number=asset.serialNumber,
                assigned_at=datetime.utcnow(),
                status="assigned"
            )
            db.add(new_asset)

    # 9. Create Onboarding checklist tracker
    onboarding = Onboarding(
        tenant_id=tenant_id,
        employee_id=emp_id,
        status="in_progress",
        completed_steps=["basic", "org", "docs", "payroll", "assets", "access"],
        checklist={
            "pan": any(d.documentType == "pan" for d in payload.documents) if payload.documents else False,
            "pf": bool(payload.payroll.uan),
            "it": len(payload.assets) > 0 if payload.assets else False,
            "em": True,
            "bg": False
        }
    )
    db.add(onboarding)

    # 10. Audit Log & Notification
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=user.id,
        email=user.email,
        action="EMPLOYEE_ONBOARDED",
        details=f"Onboarded employee {full_name} ({emp_id}) with role {payload.systemAccess.role}."
    )
    db.add(audit)

    notification = Notification(
        tenant_id=tenant_id,
        type="onboarding_task",
        title="New Onboarding Flow Initiated",
        message=f"Employee onboarding setup completed for {full_name} ({emp_id}). Tasks dispatched.",
        read=False,
        url="/onboarding",
        actor={"name": full_name}
    )
    db.add(notification)

    db.commit()

    return {
        "success": True,
        "data": {
            "employeeId": emp_id,
            "fullName": full_name,
            "email": email_lower,
            "tempPassword": temp_password,
            "role": payload.systemAccess.role
        },
        "message": "Onboarding setup completed successfully. Candidate login and profile generated."
    }
