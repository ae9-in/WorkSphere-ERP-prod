from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Integer, JSON, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import TenantBaseModel, BaseModel


class HiringPlan(TenantBaseModel):
    __tablename__ = "hiring_plans"

    department_name      = Column(String, nullable=False)
    branch               = Column(String, nullable=True)               # §6
    team                 = Column(String, nullable=True)               # §6
    position_title       = Column(String, nullable=False)
    hiring_count         = Column(Integer, default=1, nullable=False)
    budget               = Column(Float, default=0.0, nullable=False)
    quarter              = Column(String, nullable=False)              # e.g. "Q3-2026"
    hiring_timeline      = Column(String, nullable=True)               # §6
    business_justification = Column(Text, nullable=True)              # §6
    priority             = Column(String, default="medium", nullable=False)  # low, medium, high
    status               = Column(String, default="active", nullable=False)  # active, completed, cancelled


class JobRequisition(TenantBaseModel):
    __tablename__ = "job_requisitions"

    requisition_number   = Column(String, nullable=False, unique=True)
    title                = Column(String, nullable=False)
    department_name      = Column(String, nullable=False)
    job_type             = Column(String, nullable=True)              # §7: full_time, part_time, contract, internship, temporary, consultant
    hiring_manager_id    = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    open_positions       = Column(Integer, default=1, nullable=False)
    expected_joining_date = Column(Date, nullable=True)              # §7
    salary_range         = Column(String, nullable=True)
    budget               = Column(Float, default=0.0, nullable=False)
    status               = Column(String, default="pending", nullable=False)  # pending, approved, rejected

    hiring_manager       = relationship("Employee")
    recruiter_assignments = relationship("RecruiterAssignment", back_populates="requisition", cascade="all, delete-orphan")


class JobPosting(TenantBaseModel):
    __tablename__ = "job_postings"

    requisition_id       = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id", ondelete="CASCADE"), nullable=False, index=True)
    title                = Column(String, nullable=False)
    department_name      = Column(String, nullable=False)
    location             = Column(String, nullable=False)
    employment_type      = Column(String, nullable=False)  # full_time, part_time, contract, internship, temporary, consultant
    experience_years     = Column(Integer, default=0, nullable=False)
    skills               = Column(String, nullable=False)             # comma-separated
    qualifications       = Column(Text, nullable=True)                # §9
    responsibilities     = Column(Text, nullable=True)                # §9
    benefits             = Column(Text, nullable=True)                # §9
    salary_range         = Column(String, nullable=True)              # §9
    application_deadline = Column(Date, nullable=True)                # §9
    description          = Column(Text, nullable=False)
    status               = Column(String, default="draft", nullable=False)  # draft, published, closed

    requisition          = relationship("JobRequisition")


class Candidate(TenantBaseModel):
    __tablename__ = "candidates"

    full_name            = Column(String, nullable=False)
    email                = Column(String, nullable=False, index=True)
    phone                = Column(String, nullable=True)
    address              = Column(String, nullable=True)               # §20
    current_company      = Column(String, nullable=True)
    current_ctc          = Column(Float, default=0.0, nullable=False)
    expected_ctc         = Column(Float, default=0.0, nullable=False)
    notice_period        = Column(Integer, default=30, nullable=False)  # days
    preferred_location   = Column(String, nullable=True)
    portfolio_url        = Column(String, nullable=True)               # §20
    linkedin_url         = Column(String, nullable=True)               # §20
    github_url           = Column(String, nullable=True)               # §20
    source               = Column(String, default="career_portal", nullable=False)  # §12: career_portal, linkedin, referral, job_portal, campus, agency, walk_in, internal
    application_source   = Column(String, nullable=True)               # §20 free-text source detail

    status               = Column(String, default="applied", nullable=False)
    # applied, screening, assessment, technical_interview, hr_interview, selected, rejected, offer, onboarding, hired
    ats_score            = Column(Integer, default=0, nullable=False)
    resume_url           = Column(String, nullable=True)
    resume_text          = Column(Text, nullable=True)

    skills               = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    experience           = relationship("CandidateExperience", back_populates="candidate", cascade="all, delete-orphan")
    education            = relationship("CandidateEducation", back_populates="candidate", cascade="all, delete-orphan")
    references           = relationship("CandidateReference", back_populates="candidate", cascade="all, delete-orphan")
    pipeline_history     = relationship("RecruitmentPipelineHistory", back_populates="candidate", cascade="all, delete-orphan")


class CandidateSkill(BaseModel):
    __tablename__ = "candidate_skills"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name           = Column(String, nullable=False)

    candidate            = relationship("Candidate", back_populates="skills")


class CandidateExperience(BaseModel):
    __tablename__ = "candidate_experience"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name         = Column(String, nullable=False)
    designation          = Column(String, nullable=False)
    start_date           = Column(String, nullable=True)
    end_date             = Column(String, nullable=True)
    description          = Column(Text, nullable=True)

    candidate            = relationship("Candidate", back_populates="experience")


class CandidateEducation(BaseModel):
    __tablename__ = "candidate_education"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    institution          = Column(String, nullable=False)
    degree               = Column(String, nullable=False)
    field_of_study       = Column(String, nullable=True)
    graduation_year      = Column(Integer, nullable=True)

    candidate            = relationship("Candidate", back_populates="education")


# §44 — Reference contacts provided by candidate
class CandidateReference(TenantBaseModel):
    __tablename__ = "candidate_references"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    reference_name       = Column(String, nullable=False)
    reference_company    = Column(String, nullable=True)
    reference_designation = Column(String, nullable=True)
    relationship_type    = Column(String, nullable=True)              # manager, colleague, client
    reference_email      = Column(String, nullable=True)
    reference_phone      = Column(String, nullable=True)
    verification_status  = Column(String, default="pending", nullable=False)  # pending, passed, failed

    candidate            = relationship("Candidate", back_populates="references")
    check                = relationship("ReferenceCheck", back_populates="reference", uselist=False, cascade="all, delete-orphan")


# §44 — Reference verification outcome
class ReferenceCheck(TenantBaseModel):
    __tablename__ = "reference_checks"

    reference_id         = Column(UUID(as_uuid=True), ForeignKey("candidate_references.id", ondelete="CASCADE"), nullable=False, index=True)
    contacted_at         = Column(DateTime, nullable=True)
    outcome              = Column(String, nullable=True)              # positive, negative, neutral
    notes                = Column(Text, nullable=True)
    verified_by          = Column(String, nullable=True)

    reference            = relationship("CandidateReference", back_populates="check")


class Assessment(TenantBaseModel):
    __tablename__ = "assessments"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_name      = Column(String, nullable=False)
    assessment_type      = Column(String, default="aptitude", nullable=False)  # coding, aptitude, mcq, domain, personality
    score                = Column(Integer, default=0, nullable=False)
    max_score            = Column(Integer, default=100, nullable=False)
    status               = Column(String, default="pending", nullable=False)   # pending, completed, expired
    completed_at         = Column(DateTime, nullable=True)

    candidate            = relationship("Candidate")


class Interview(TenantBaseModel):
    __tablename__ = "interviews"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    title                = Column(String, nullable=False)
    type                 = Column(String, default="technical", nullable=False)  # technical, hr, panel, ai_technical, ai_hr
    scheduled_at         = Column(DateTime, nullable=False)
    timezone             = Column(String, default="Asia/Kolkata", nullable=False)
    video_link           = Column(String, nullable=True)
    status               = Column(String, default="scheduled", nullable=False)  # scheduled, completed, cancelled, rescheduled
    rescheduled_at       = Column(DateTime, nullable=True)
    rescheduled_reason   = Column(String, nullable=True)

    candidate            = relationship("Candidate")
    feedback             = relationship("InterviewFeedback", back_populates="interview", cascade="all, delete-orphan")


class InterviewFeedback(TenantBaseModel):
    __tablename__ = "interview_feedback"

    interview_id         = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_name     = Column(String, nullable=False)
    technical_rating     = Column(Integer, default=0, nullable=False)   # 1-5
    communication_rating = Column(Integer, default=0, nullable=False)
    problem_solving_rating = Column(Integer, default=0, nullable=False)
    cultural_fit_rating  = Column(Integer, default=0, nullable=False)
    comments             = Column(Text, nullable=True)
    recommendation       = Column(String, default="hire", nullable=False)  # hire, no_hire, hold

    interview            = relationship("Interview", back_populates="feedback")


class Offer(TenantBaseModel):
    __tablename__ = "offers"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_title            = Column(String, nullable=False)
    employment_type      = Column(String, default="full_time", nullable=False)   # §39
    department_name      = Column(String, nullable=True)                          # §39
    reporting_manager    = Column(String, nullable=True)                          # §39
    ctc                  = Column(Float, default=0.0, nullable=False)
    fixed_pay            = Column(Float, default=0.0, nullable=False)
    variable_pay         = Column(Float, default=0.0, nullable=False)
    joining_bonus        = Column(Float, default=0.0, nullable=False)             # §39
    probation_period     = Column(Integer, default=90, nullable=False)            # §39 days
    joining_date         = Column(DateTime, nullable=False)
    offer_expiry_date    = Column(DateTime, nullable=True)
    status               = Column(String, default="pending", nullable=False)
    # pending, approved, sent, accepted, rejected, expired, negotiation_requested, withdrawn
    version              = Column(Integer, default=1, nullable=False)
    approval_history     = Column(JSON, default=list, nullable=False)

    candidate            = relationship("Candidate")


class BackgroundVerification(TenantBaseModel):
    __tablename__ = "background_verification"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    identity_status      = Column(String, default="pending", nullable=False)  # pending, passed, failed
    education_status     = Column(String, default="pending", nullable=False)
    employment_status    = Column(String, default="pending", nullable=False)
    address_status       = Column(String, default="pending", nullable=False)  # §43
    criminal_status      = Column(String, default="pending", nullable=False)
    reference_status     = Column(String, default="pending", nullable=False)
    overall_status       = Column(String, default="pending", nullable=False)  # pending, passed, failed
    initiated_at         = Column(DateTime, nullable=True)
    completed_at         = Column(DateTime, nullable=True)
    vendor_name          = Column(String, nullable=True)                      # BGV vendor

    candidate            = relationship("Candidate")


# §57 — Immutable pipeline stage history (separate from timeline)
class RecruitmentPipelineHistory(TenantBaseModel):
    __tablename__ = "recruitment_pipeline"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    from_stage           = Column(String, nullable=True)
    to_stage             = Column(String, nullable=False)
    moved_by             = Column(String, nullable=True)
    move_reason          = Column(String, nullable=True)
    duration_days        = Column(Integer, nullable=True)              # days spent in from_stage

    candidate            = relationship("Candidate", back_populates="pipeline_history")


# §15, §57 — Recruiter-to-Requisition assignment
class RecruiterAssignment(TenantBaseModel):
    __tablename__ = "recruiter_assignments"

    requisition_id       = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id              = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role                 = Column(String, default="recruiter", nullable=False)  # recruiter, hiring_manager, interviewer, hr_rep, dept_head

    requisition          = relationship("JobRequisition", back_populates="recruiter_assignments")


class RecruitmentTimeline(TenantBaseModel):
    __tablename__ = "recruitment_timelines"

    candidate_id         = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    action               = Column(String, nullable=False)
    details              = Column(Text, nullable=True)
    performed_by         = Column(String, nullable=True)

    candidate            = relationship("Candidate")
