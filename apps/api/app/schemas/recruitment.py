from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date


# ── Hiring Plans ──────────────────────────────────────────────────────────────

class HiringPlanCreateSchema(BaseModel):
    departmentName: str
    branch: Optional[str] = None
    team: Optional[str] = None
    positionTitle: str
    hiringCount: int = 1
    budget: float = 0.0
    quarter: str
    hiringTimeline: Optional[str] = None
    businessJustification: Optional[str] = None
    priority: str = "medium"

    class Config:
        from_attributes = True


# ── Job Requisitions ──────────────────────────────────────────────────────────

class JobRequisitionCreateSchema(BaseModel):
    title: str
    departmentName: str
    jobType: Optional[str] = "full_time"
    openPositions: int = 1
    expectedJoiningDate: Optional[str] = None
    salaryRange: Optional[str] = None
    budget: float = 0.0

    class Config:
        from_attributes = True


class HiringTeamSchema(BaseModel):
    userIds: List[str]
    role: str = "recruiter"

    class Config:
        from_attributes = True


# ── Job Postings ──────────────────────────────────────────────────────────────

class JobPostingCreateSchema(BaseModel):
    requisitionId: str
    title: str
    departmentName: str
    location: str
    employmentType: str
    experienceYears: int = 0
    skills: str
    qualifications: Optional[str] = None
    responsibilities: Optional[str] = None
    benefits: Optional[str] = None
    salaryRange: Optional[str] = None
    applicationDeadline: Optional[str] = None
    description: str

    class Config:
        from_attributes = True


# ── Candidate Application ─────────────────────────────────────────────────────

class CandidateApplySchema(BaseModel):
    fullName: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    currentCompany: Optional[str] = None
    currentCtc: float = 0.0
    expectedCtc: float = 0.0
    noticePeriod: int = 30
    preferredLocation: Optional[str] = None
    portfolioUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    source: str = "career_portal"
    applicationSource: Optional[str] = None
    jobPostingId: Optional[str] = None
    resumeText: Optional[str] = None

    class Config:
        from_attributes = True


class CandidatePipelineMoveSchema(BaseModel):
    candidateId: str
    newStatus: str
    moveReason: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateSearchSchema(BaseModel):
    q: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    department: Optional[str] = None
    minAtsScore: Optional[int] = None
    maxAtsScore: Optional[int] = None
    page: int = 1
    pageSize: int = 20

    class Config:
        from_attributes = True


# ── Resume Parsing ────────────────────────────────────────────────────────────

class ResumeParseSchema(BaseModel):
    resumeText: str
    candidateId: Optional[str] = None

    class Config:
        from_attributes = True


# ── ATS Scoring ───────────────────────────────────────────────────────────────

class ATSScoringRequestSchema(BaseModel):
    candidateId: str
    jobPostingId: str

    class Config:
        from_attributes = True


# ── Interviews ────────────────────────────────────────────────────────────────

class InterviewScheduleSchema(BaseModel):
    candidateId: str
    title: str
    type: str = "technical"
    scheduledAt: str
    timezone: str = "Asia/Kolkata"
    videoLink: Optional[str] = None

    class Config:
        from_attributes = True


class InterviewRescheduleSchema(BaseModel):
    interviewId: str
    scheduledAt: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class InterviewFeedbackSchema(BaseModel):
    interviewId: str
    interviewerName: str
    technicalRating: int = 3
    communicationRating: int = 3
    problemSolvingRating: int = 3
    culturalFitRating: int = 3
    comments: Optional[str] = None
    recommendation: str = "hire"

    class Config:
        from_attributes = True


# ── Offers ────────────────────────────────────────────────────────────────────

class OfferCreateSchema(BaseModel):
    candidateId: str
    jobTitle: str
    employmentType: str = "full_time"
    departmentName: Optional[str] = None
    reportingManager: Optional[str] = None
    ctc: float
    fixedPay: float
    variablePay: float = 0.0
    joiningBonus: float = 0.0
    probationPeriod: int = 90
    joiningDate: str
    offerExpiryDate: Optional[str] = None

    class Config:
        from_attributes = True


class OfferApproveSchema(BaseModel):
    offerId: str
    status: str
    comments: Optional[str] = None

    class Config:
        from_attributes = True


# ── Background Verification ───────────────────────────────────────────────────

class BackgroundCheckSchema(BaseModel):
    candidateId: str
    identityStatus: str = "pending"
    educationStatus: str = "pending"
    employmentStatus: str = "pending"
    addressStatus: str = "passed"
    criminalStatus: str = "pending"
    referenceStatus: str = "pending"
    vendorName: Optional[str] = None

    class Config:
        from_attributes = True


# ── References ────────────────────────────────────────────────────────────────

class CandidateReferenceSchema(BaseModel):
    candidateId: str
    referenceName: str
    referenceCompany: Optional[str] = None
    referenceDesignation: Optional[str] = None
    relationshipType: Optional[str] = None
    referenceEmail: Optional[str] = None
    referencePhone: Optional[str] = None

    class Config:
        from_attributes = True


class ReferenceCheckUpdateSchema(BaseModel):
    referenceId: str
    outcome: str
    notes: Optional[str] = None
    verifiedBy: Optional[str] = None

    class Config:
        from_attributes = True


# ── HRMS Conversion ───────────────────────────────────────────────────────────

class CandidateConvertSchema(BaseModel):
    candidateId: str
    departmentName: str
    designationName: str
    dateOfJoining: str
    workEmail: str

    class Config:
        from_attributes = True
