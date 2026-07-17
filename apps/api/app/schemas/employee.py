from pydantic import BaseModel, EmailStr
from typing import Optional, List

class PersonalSchema(BaseModel):
    firstName: str
    lastName: str
    middleName: Optional[str] = None
    displayName: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    maritalStatus: Optional[str] = None
    nationality: Optional[str] = "Indian"
    bloodGroup: Optional[str] = None
    personalEmail: Optional[EmailStr] = None
    personalPhone: Optional[str] = None
    photo: Optional[str] = None

class AddressSchema(BaseModel):
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    pincode: Optional[str] = None

class OfficialSchema(BaseModel):
    workEmail: EmailStr
    workPhone: Optional[str] = None
    employeeType: Optional[str] = "full_time"
    dateOfJoining: str
    confirmationDate: Optional[str] = None
    probationEndDate: Optional[str] = None
    status: Optional[str] = "active"
    exitDate: Optional[str] = None
    lastWorkingDay: Optional[str] = None

class JobSchema(BaseModel):
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    designationId: Optional[str] = None
    designationName: Optional[str] = None
    gradeId: Optional[str] = None
    gradeName: Optional[str] = None
    locationId: Optional[str] = None
    locationName: Optional[str] = None
    reportingManagerId: Optional[str] = None
    reportingManagerName: Optional[str] = None
    workMode: Optional[str] = "hybrid"
    shiftId: Optional[str] = None
    shiftName: Optional[str] = None
    costCenter: Optional[str] = None

class SalarySchema(BaseModel):
    ctc: float = 0.0
    basicPercent: float = 40.0
    currency: str = "INR"
    effectiveDate: Optional[str] = None
    paymentMode: str = "bank_transfer"

class EducationSchema(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    startYear: Optional[int] = None
    endYear: Optional[int] = None
    percentage: Optional[float] = None
    documentUrl: Optional[str] = None

    class Config:
        from_attributes = True


class ExperienceSchema(BaseModel):
    company: Optional[str] = None
    designation: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isCurrent: bool = False
    responsibilities: Optional[str] = None
    ctc: Optional[float] = None

    class Config:
        from_attributes = True


class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone: str
    isPrimary: bool = False

    class Config:
        from_attributes = True


class BankAccountSchema(BaseModel):
    id: Optional[str] = None
    bankName: str
    accountHolderName: str
    accountNumber: str
    ifscSwiftCode: str
    branchName: str
    accountType: Optional[str] = "savings"
    upiId: Optional[str] = None
    isPrimary: Optional[bool] = True

    class Config:
        from_attributes = True


class SkillSchema(BaseModel):
    id: Optional[str] = None
    skillName: str
    skillType: Optional[str] = "technical"
    proficiencyLevel: Optional[str] = None

    class Config:
        from_attributes = True


class CertificationSchema(BaseModel):
    id: Optional[str] = None
    certificationName: str
    issuingAuthority: str
    issueDate: Optional[str] = None
    expiryDate: Optional[str] = None
    credentialId: Optional[str] = None
    credentialUrl: Optional[str] = None

    class Config:
        from_attributes = True


class TimelineSchema(BaseModel):
    id: Optional[str] = None
    eventType: str
    title: str
    description: Optional[str] = None
    eventDate: str
    performedBy: Optional[str] = None
    metadataJson: Optional[dict] = None

    class Config:
        from_attributes = True


class EmployeeCreateSchema(BaseModel):
    personal: PersonalSchema
    official: OfficialSchema
    job: Optional[JobSchema] = None
    salary: Optional[SalarySchema] = None
    addressPermanent: Optional[AddressSchema] = None
    addressCurrent: Optional[AddressSchema] = None
    education: Optional[List[EducationSchema]] = None
    experience: Optional[List[ExperienceSchema]] = None
    emergencyContacts: Optional[List[EmergencyContactSchema]] = None
    bank: Optional[List[BankAccountSchema]] = None
    skills: Optional[List[SkillSchema]] = None
    certifications: Optional[List[CertificationSchema]] = None


class EmployeeUpdateSchema(BaseModel):
    personal: Optional[PersonalSchema] = None
    official: Optional[OfficialSchema] = None
    job: Optional[JobSchema] = None
    salary: Optional[SalarySchema] = None
    addressPermanent: Optional[AddressSchema] = None
    addressCurrent: Optional[AddressSchema] = None
    education: Optional[List[EducationSchema]] = None
    experience: Optional[List[ExperienceSchema]] = None
    emergencyContacts: Optional[List[EmergencyContactSchema]] = None
    bank: Optional[List[BankAccountSchema]] = None
    skills: Optional[List[SkillSchema]] = None
    certifications: Optional[List[CertificationSchema]] = None


class EmployeeActionSchema(BaseModel):
    action: str
    data: Optional[dict] = None
