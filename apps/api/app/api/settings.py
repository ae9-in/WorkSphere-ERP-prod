from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.models.company import Company
from app.models.settings import Department, Designation, EmploymentType, Branch, CompanySettings, HolidayCalendar, Holiday
from app.models.leave import LeaveType
from app.models.payroll import SalaryStructure, SalaryStructureComponent
from app.models.workflow import WorkflowDefinition, WorkflowDefinitionStep
from app.schemas.settings import (
    SettingsResponse, DepartmentSchema, DesignationSchema,
    EmploymentTypeSchema, BranchSchema, CompanySettingsSchema,
    HolidayCalendarListResponse, HolidayCalendarResponse, HolidayCalendarSchema
)
from app.models.audit import AuditLog
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/settings", tags=["settings"])

def get_or_create_company_settings(db: Session, tenant_id: uuid.UUID) -> CompanySettings:
    settings = db.query(CompanySettings).filter(CompanySettings.tenant_id == tenant_id).first()
    if not settings:
        settings = CompanySettings(
            tenant_id=tenant_id,
            basic_percent=40.0,
            hra_percent=50.0,
            pf_enabled=True,
            esi_enabled=True,
            gps_enabled=False
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def seed_defaults_if_empty(db: Session, tenant_id: uuid.UUID):
    # Departments
    if db.query(Department).filter(Department.tenant_id == tenant_id).count() == 0:
        depts = [
            Department(tenant_id=tenant_id, name="Engineering", code="ENG"),
            Department(tenant_id=tenant_id, name="Operations", code="OPS"),
            Department(tenant_id=tenant_id, name="Product", code="PRD"),
            Department(tenant_id=tenant_id, name="Human Resources", code="HR")
        ]
        db.add_all(depts)

    # Designations
    if db.query(Designation).filter(Designation.tenant_id == tenant_id).count() == 0:
        desigs = [
            Designation(tenant_id=tenant_id, name="Software Engineer", code="SWE"),
            Designation(tenant_id=tenant_id, name="Product Manager", code="PM"),
            Designation(tenant_id=tenant_id, name="HR Manager", code="HRM")
        ]
        db.add_all(desigs)

    # Employment Types
    if db.query(EmploymentType).filter(EmploymentType.tenant_id == tenant_id).count() == 0:
        types = [
            EmploymentType(tenant_id=tenant_id, name="Full Time", code="FT"),
            EmploymentType(tenant_id=tenant_id, name="Part Time", code="PT"),
            EmploymentType(tenant_id=tenant_id, name="Contract", code="CT"),
            EmploymentType(tenant_id=tenant_id, name="Intern", code="IN")
        ]
        db.add_all(types)

    # Branches
    if db.query(Branch).filter(Branch.tenant_id == tenant_id).count() == 0:
        branches = [
            Branch(tenant_id=tenant_id, name="Headquarters", code="HQ", lat=12.9716, lng=77.5946, geofence_radius=500.0)
        ]
        db.add_all(branches)
        
    db.commit()


@router.get("", response_model=SettingsResponse)
def get_settings(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
        
    company = db.query(Company).filter(Company.id == tenant_id).first()
    settings = get_or_create_company_settings(db, tenant_id)
    seed_defaults_if_empty(db, tenant_id)
    
    depts = db.query(Department).filter(Department.tenant_id == tenant_id).all()
    desigs = db.query(Designation).filter(Designation.tenant_id == tenant_id).all()
    emptypes = db.query(EmploymentType).filter(EmploymentType.tenant_id == tenant_id).all()
    branches = db.query(Branch).filter(Branch.tenant_id == tenant_id).all()
    
    return {
        "success": True,
        "data": {
            "company": company,
            "settings": settings,
            "departments": depts,
            "designations": desigs,
            "employmentTypes": emptypes,
            "branches": branches
        }
    }


@router.put("")
def update_settings(payload: CompanySettingsSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    settings = get_or_create_company_settings(db, tenant_id)
    
    settings.basic_percent = payload.basic_percent
    settings.hra_percent = payload.hra_percent
    settings.pf_enabled = payload.pf_enabled
    settings.esi_enabled = payload.esi_enabled
    settings.gps_enabled = payload.gps_enabled
    
    # Audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=user.id,
        email=user.email,
        action="SETTINGS_UPDATE",
        details=f"Updated general settings for company {tenant_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(settings)
    return {"success": True, "data": settings}


import json
import os

PROFILE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "company_profile.json")

def load_profile():
    if os.path.exists(PROFILE_FILE):
        try:
            with open(PROFILE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "companyName": "WorkSphere Technologies",
        "legalName": "WorkSphere Technologies Private Limited",
        "cin": "U72200KA2026PTC099120",
        "gstin": "29AAAAA0000A1Z5",
        "currency": "INR (₹)",
        "locale": "English (India)",
        "supportEmail": "ops@worksphere.co",
        "phone": "+91 80 4390 0000"
    }

def save_profile(data):
    try:
        with open(PROFILE_FILE, "w") as f:
            json.dump(data, f)
    except Exception:
        pass

@router.get("/company")
def get_company_profile(user: User = Depends(verify_tenant)):
    return {"success": True, "data": load_profile()}

@router.put("/company")
def update_company_profile(payload: dict, user: User = Depends(verify_tenant)):
    current = load_profile()
    current.update(payload)
    save_profile(current)
    return {"success": True, "data": current}


# ── DEPARTMENTS ───────────────────────────────────────────────────
@router.get("/departments", response_model=List[DepartmentSchema])
def get_departments(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.tenant_id == user.company_id).all()

@router.post("/departments")
def add_department(payload: DepartmentSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    dept = Department(tenant_id=user.company_id, name=payload.name, code=payload.code)
    db.add(dept)
    db.commit()
    return db.query(Department).filter(Department.tenant_id == user.company_id).all()

@router.put("/departments/{id}")
def update_department(id: str, payload: DepartmentSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == uuid.UUID(id), Department.tenant_id == user.company_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.name = payload.name
    dept.code = payload.code
    db.commit()
    return db.query(Department).filter(Department.tenant_id == user.company_id).all()

@router.delete("/departments/{id}")
def delete_department(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == uuid.UUID(id), Department.tenant_id == user.company_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return db.query(Department).filter(Department.tenant_id == user.company_id).all()


# ── DESIGNATIONS ──────────────────────────────────────────────────
@router.get("/designations", response_model=List[DesignationSchema])
def get_designations(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    return db.query(Designation).filter(Designation.tenant_id == user.company_id).all()

@router.post("/designations")
def add_designation(payload: DesignationSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    desig = Designation(tenant_id=user.company_id, name=payload.name, code=payload.code)
    db.add(desig)
    db.commit()
    return db.query(Designation).filter(Designation.tenant_id == user.company_id).all()

@router.put("/designations/{id}")
def update_designation(id: str, payload: DesignationSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    desig = db.query(Designation).filter(Designation.id == uuid.UUID(id), Designation.tenant_id == user.company_id).first()
    if not desig:
        raise HTTPException(status_code=404, detail="Designation not found")
    desig.name = payload.name
    desig.code = payload.code
    db.commit()
    return db.query(Designation).filter(Designation.tenant_id == user.company_id).all()

@router.delete("/designations/{id}")
def delete_designation(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    desig = db.query(Designation).filter(Designation.id == uuid.UUID(id), Designation.tenant_id == user.company_id).first()
    if not desig:
        raise HTTPException(status_code=404, detail="Designation not found")
    db.delete(desig)
    db.commit()
    return db.query(Designation).filter(Designation.tenant_id == user.company_id).all()


# ── EMPLOYMENT TYPES ──────────────────────────────────────────────
@router.get("/employment-types", response_model=List[EmploymentTypeSchema])
def get_employment_types(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    return db.query(EmploymentType).filter(EmploymentType.tenant_id == user.company_id).all()

@router.post("/employment-types")
def add_employment_type(payload: EmploymentTypeSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    emptype = EmploymentType(tenant_id=user.company_id, name=payload.name, code=payload.code)
    db.add(emptype)
    db.commit()
    return db.query(EmploymentType).filter(EmploymentType.tenant_id == user.company_id).all()

@router.put("/employment-types/{id}")
def update_employment_type(id: str, payload: EmploymentTypeSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    emptype = db.query(EmploymentType).filter(EmploymentType.id == uuid.UUID(id), EmploymentType.tenant_id == user.company_id).first()
    if not emptype:
        raise HTTPException(status_code=404, detail="Employment type not found")
    emptype.name = payload.name
    emptype.code = payload.code
    db.commit()
    return db.query(EmploymentType).filter(EmploymentType.tenant_id == user.company_id).all()

@router.delete("/employment-types/{id}")
def delete_employment_type(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    emptype = db.query(EmploymentType).filter(EmploymentType.id == uuid.UUID(id), EmploymentType.tenant_id == user.company_id).first()
    if not emptype:
        raise HTTPException(status_code=404, detail="Employment type not found")
    db.delete(emptype)
    db.commit()
    return db.query(EmploymentType).filter(EmploymentType.tenant_id == user.company_id).all()


# ── BRANCHES ──────────────────────────────────────────────────────
@router.get("/branches", response_model=List[BranchSchema])
def get_branches(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    return db.query(Branch).filter(Branch.tenant_id == user.company_id).all()

@router.post("/branches")
def add_branch(payload: BranchSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    branch = Branch(
        tenant_id=user.company_id,
        name=payload.name,
        code=payload.code,
        lat=payload.lat,
        lng=payload.lng,
        geofence_radius=payload.geofence_radius
    )
    db.add(branch)
    db.commit()
    return db.query(Branch).filter(Branch.tenant_id == user.company_id).all()

@router.put("/branches/{id}")
def update_branch(id: str, payload: BranchSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.id == uuid.UUID(id), Branch.tenant_id == user.company_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    branch.name = payload.name
    branch.code = payload.code
    branch.lat = payload.lat
    branch.lng = payload.lng
    branch.geofence_radius = payload.geofence_radius
    db.commit()
    return db.query(Branch).filter(Branch.tenant_id == user.company_id).all()

@router.delete("/branches/{id}")
def delete_branch(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.id == uuid.UUID(id), Branch.tenant_id == user.company_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    db.delete(branch)
    db.commit()
    return db.query(Branch).filter(Branch.tenant_id == user.company_id).all()


# ── HOLIDAY CALENDARS ─────────────────────────────────────────────
@router.get("/holiday-calendars", response_model=HolidayCalendarListResponse)
def get_holiday_calendars(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    calendars = db.query(HolidayCalendar).filter(HolidayCalendar.tenant_id == user.company_id).all()
    # Serialize holidays nested relation
    res_data = []
    for cal in calendars:
        holidays_serialized = []
        for h in cal.holidays:
            holidays_serialized.append({
                "date": h.date.strftime("%Y-%m-%d"),
                "name": h.name,
                "type": h.type
            })
        res_data.append({
            "id": str(cal.id),
            "name": cal.name,
            "year": cal.year,
            "holidays": holidays_serialized
        })
    return {"success": True, "data": res_data}


@router.post("/holiday-calendars", response_model=HolidayCalendarResponse)
def save_holiday_calendar(payload: HolidayCalendarSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    
    # Check if calendar for this year already exists
    cal = db.query(HolidayCalendar).filter(HolidayCalendar.tenant_id == tenant_id, HolidayCalendar.year == payload.year).first()
    if cal:
        # Delete old holidays to overwrite
        db.query(Holiday).filter(Holiday.calendar_id == cal.id).delete()
        cal.name = payload.name
    else:
        cal = HolidayCalendar(tenant_id=tenant_id, name=payload.name, year=payload.year)
        db.add(cal)
        db.flush()
        
    for h in payload.holidays:
        dt = datetime.strptime(h.date, "%Y-%m-%d")
        holiday = Holiday(calendar_id=cal.id, date=dt, name=h.name, type=h.type)
        db.add(holiday)
        
    db.commit()
    db.refresh(cal)
    
    # Return formatted calendar
    holidays_serialized = []
    for h in cal.holidays:
        holidays_serialized.append({
            "date": h.date.strftime("%Y-%m-%d"),
            "name": h.name,
            "type": h.type
        })
        
    return {
        "success": True,
        "data": {
            "id": str(cal.id),
            "name": cal.name,
            "year": cal.year,
            "holidays": holidays_serialized
        }
    }


# ── INITIALIZER ───────────────────────────────────────────────────
@router.post("/initialize")
def initialize_settings(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    
    # 1. Company Settings Document & seed standard tables
    get_or_create_company_settings(db, tenant_id)
    seed_defaults_if_empty(db, tenant_id)
    
    # 2. Leave Types
    leave_types = [
        {"name": "Annual Leave", "code": "AL", "is_paid": True, "accrual_based": True, "max_days": 15, "carry_forward": True, "requires_approval": True},
        {"name": "Sick Leave", "code": "SL", "is_paid": True, "accrual_based": False, "max_days": 7, "carry_forward": False, "requires_approval": True},
        {"name": "Casual Leave", "code": "CL", "is_paid": True, "accrual_based": False, "max_days": 7, "carry_forward": False, "requires_approval": True},
        {"name": "Maternity Leave", "code": "ML", "is_paid": True, "accrual_based": False, "max_days": 90, "carry_forward": False, "gender": "female", "requires_approval": True},
        {"name": "Paternity Leave", "code": "PL", "is_paid": True, "accrual_based": False, "max_days": 10, "carry_forward": False, "gender": "male", "requires_approval": True},
        {"name": "Loss Of Pay", "code": "LOP", "is_paid": False, "accrual_based": False, "max_days": 365, "carry_forward": False, "requires_approval": True}
    ]
    for lt in leave_types:
        existing = db.query(LeaveType).filter(LeaveType.tenant_id == tenant_id, LeaveType.code == lt["code"]).first()
        if not existing:
            new_lt = LeaveType(tenant_id=tenant_id, **lt)
            db.add(new_lt)
            
    # 3. Default Salary Structure
    existing_ss = db.query(SalaryStructure).filter(SalaryStructure.tenant_id == tenant_id, SalaryStructure.name == "Default Structure").first()
    if not existing_ss:
        ss = SalaryStructure(tenant_id=tenant_id, name="Default Structure")
        db.add(ss)
        db.flush()
        
        components = [
            {"code": "BASIC", "name": "Basic Salary", "type": "earning", "calc_type": "pct_ctc", "value": 40.0, "is_taxable": True, "is_statutory": False, "display_order": 1},
            {"code": "HRA", "name": "House Rent Allowance", "type": "earning", "calc_type": "pct_basic", "value": 50.0, "is_taxable": True, "is_statutory": False, "display_order": 2},
            {"code": "SPECIAL", "name": "Special Allowance", "type": "earning", "calc_type": "formula", "value": 0.0, "is_taxable": True, "is_statutory": False, "display_order": 3},
            {"code": "PF_EMP", "name": "Provident Fund (Employee)", "type": "deduction", "calc_type": "fixed", "value": 1800.0, "is_taxable": False, "is_statutory": True, "display_order": 4}
        ]
        for idx, comp in enumerate(components):
            c = SalaryStructureComponent(structure_id=ss.id, **comp)
            db.add(c)
            
    # 4. Default Workflow for Leaves
    existing_wf = db.query(WorkflowDefinition).filter(WorkflowDefinition.tenant_id == tenant_id, WorkflowDefinition.module == "leave").first()
    if not existing_wf:
        wf = WorkflowDefinition(tenant_id=tenant_id, module="leave", trigger="submitted", is_active=True)
        db.add(wf)
        db.flush()
        
        step = WorkflowDefinitionStep(definition_id=wf.id, step_no=1, approver_type="reporting_manager", sla_hours=48, can_delegate=True)
        db.add(step)
        
    # 5. Audit Log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=user.id,
        email=user.email,
        action="COMPANY_INITIALIZE",
        details=f"Seeded defaults for company {tenant_id}"
    )
    db.add(audit)
    db.commit()
    
    return {"success": True, "message": "Settings successfully initialized"}
