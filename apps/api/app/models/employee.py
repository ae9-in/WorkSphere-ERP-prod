import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, ForeignKey, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from app.models.base import TenantBaseModel, BaseModel

class Employee(TenantBaseModel):
    __tablename__ = "employees"

    employee_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)

    # Personal Information
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True) # male, female, non_binary, prefer_not_to_say
    marital_status = Column(String, nullable=True) # single, married, divorced, widowed
    nationality = Column(String, default="Indian", nullable=True)
    blood_group = Column(String, nullable=True)
    personal_email = Column(String, nullable=True)
    personal_phone = Column(String, nullable=True)
    photo = Column(String, nullable=True)
    father_name = Column(String, nullable=True)
    mother_name = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    passport_number = Column(String, nullable=True)
    driving_license_number = Column(String, nullable=True)

    # Address - Permanent
    perm_line1 = Column(String, nullable=True)
    perm_line2 = Column(String, nullable=True)
    perm_city = Column(String, nullable=True)
    perm_state = Column(String, nullable=True)
    perm_country = Column(String, default="India", nullable=True)
    perm_pincode = Column(String, nullable=True)

    # Address - Current
    curr_line1 = Column(String, nullable=True)
    curr_line2 = Column(String, nullable=True)
    curr_city = Column(String, nullable=True)
    curr_state = Column(String, nullable=True)
    curr_country = Column(String, default="India", nullable=True)
    curr_pincode = Column(String, nullable=True)

    # Official Info
    work_email = Column(String, unique=True, index=True, nullable=False)
    work_phone = Column(String, nullable=True)
    employee_type = Column(String, default="full_time", nullable=False) # full_time, part_time, contract, intern, consultant, probation
    date_of_joining = Column(String, nullable=False)
    confirmation_date = Column(String, nullable=True)
    probation_end_date = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False) # active, inactive, on_leave, notice_period, resigned, terminated, retired, absconding
    exit_date = Column(String, nullable=True)
    last_working_day = Column(String, nullable=True)

    # Job Info
    department_id = Column(String, nullable=True)
    department_name = Column(String, nullable=True)
    designation_id = Column(String, nullable=True)
    designation_name = Column(String, nullable=True)
    grade_id = Column(String, nullable=True)
    grade_name = Column(String, nullable=True)
    location_id = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    reporting_manager_id = Column(String, nullable=True)
    reporting_manager_name = Column(String, nullable=True)
    work_mode = Column(String, default="hybrid", nullable=False) # onsite, remote, hybrid
    shift_id = Column(String, nullable=True)
    shift_name = Column(String, nullable=True)
    cost_center = Column(String, nullable=True)

    # Salary Info
    ctc = Column(Float, default=0.0, nullable=False)
    basic_percent = Column(Float, default=40.0, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    salary_effective_date = Column(String, nullable=True)
    payment_mode = Column(String, default="bank_transfer", nullable=False) # bank_transfer, cheque, cash

    is_archived = Column(Boolean, default=False, nullable=False)

    # Relationships (one-to-many)
    education = orm_relationship("EmployeeEducation", back_populates="employee", cascade="all, delete-orphan")
    experience = orm_relationship("EmployeeExperience", back_populates="employee", cascade="all, delete-orphan")
    emergency_contacts = orm_relationship("EmployeeEmergencyContact", back_populates="employee", cascade="all, delete-orphan")
    bank_accounts = orm_relationship("EmployeeBankAccount", back_populates="employee", cascade="all, delete-orphan")
    skills = orm_relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    certifications = orm_relationship("EmployeeCertification", back_populates="employee", cascade="all, delete-orphan")
    timelines = orm_relationship("EmployeeTimeline", back_populates="employee", cascade="all, delete-orphan")


class EmployeeEducation(BaseModel):
    __tablename__ = "employee_education"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    degree = Column(String, nullable=False)
    field = Column(String, nullable=False)
    institution = Column(String, nullable=False)
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=True)
    document_url = Column(String, nullable=True)

    employee = orm_relationship("Employee", back_populates="education")


class EmployeeExperience(BaseModel):
    __tablename__ = "employee_experience"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)
    responsibilities = Column(String, nullable=True)
    ctc = Column(Float, nullable=True)

    employee = orm_relationship("Employee", back_populates="experience")


class EmployeeEmergencyContact(BaseModel):
    __tablename__ = "employee_emergency_contacts"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    employee = orm_relationship("Employee", back_populates="emergency_contacts")


class EmployeeBankAccount(TenantBaseModel):
    __tablename__ = "employee_bank_accounts"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_name = Column(String, nullable=False)
    account_holder_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    ifsc_swift_code = Column(String, nullable=False)
    branch_name = Column(String, nullable=False)
    account_type = Column(String, default="savings", nullable=False)
    upi_id = Column(String, nullable=True)
    is_primary = Column(Boolean, default=True, nullable=False)

    employee = orm_relationship("Employee", back_populates="bank_accounts")


class EmployeeSkill(TenantBaseModel):
    __tablename__ = "employee_skills"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String, nullable=False)
    skill_type = Column(String, default="technical", nullable=False) # technical, soft, language
    proficiency_level = Column(String, nullable=True) # beginner, intermediate, expert

    employee = orm_relationship("Employee", back_populates="skills")


class EmployeeCertification(TenantBaseModel):
    __tablename__ = "employee_certifications"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    certification_name = Column(String, nullable=False)
    issuing_authority = Column(String, nullable=False)
    issue_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    credential_id = Column(String, nullable=True)
    credential_url = Column(String, nullable=True)

    employee = orm_relationship("Employee", back_populates="certifications")


class EmployeeTimeline(TenantBaseModel):
    __tablename__ = "employee_timelines"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    performed_by = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    employee = orm_relationship("Employee", back_populates="timelines")
