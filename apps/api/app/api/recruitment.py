from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.recruitment import RecruitmentService
from app.schemas.recruitment import (
    HiringPlanCreateSchema, JobRequisitionCreateSchema, JobPostingCreateSchema,
    HiringTeamSchema, CandidateApplySchema, CandidatePipelineMoveSchema,
    CandidateSearchSchema, ResumeParseSchema, ATSScoringRequestSchema,
    InterviewScheduleSchema, InterviewRescheduleSchema, InterviewFeedbackSchema,
    OfferCreateSchema, OfferApproveSchema,
    BackgroundCheckSchema, CandidateReferenceSchema, ReferenceCheckUpdateSchema,
    CandidateConvertSchema
)
from pydantic import BaseModel

router = APIRouter(prefix="/recruitment", tags=["Recruitment & ATS"])
public_router = APIRouter(prefix="/public", tags=["Career Portal (Public)"])


class RequisitionApprovePayload(BaseModel):
    status: str

class OfferRespondPayload(BaseModel):
    response: str


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC — Career Portal (no auth required)
# ═══════════════════════════════════════════════════════════════════════════════

@public_router.get("/jobs", summary="Public job listings for career portal (§13)")
def public_job_listings(db: Session = Depends(get_db)):
    return {"success": True, "data": RecruitmentService.get_public_jobs(db)}


# ═══════════════════════════════════════════════════════════════════════════════
# HIRING PLANS  §6
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/hiring-plans", status_code=status.HTTP_201_CREATED, summary="Create annual/quarterly hiring plan")
def create_hiring_plan(
    payload: HiringPlanCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.create_hiring_plan(db, payload, user.company_id)}


@router.get("/hiring-plans", summary="List hiring plans")
def list_hiring_plans(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.list_hiring_plans(db, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# JOB REQUISITIONS  §7
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/requisitions", status_code=status.HTTP_201_CREATED, summary="Create job requisition")
def create_requisition(
    payload: JobRequisitionCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.create_requisition(db, payload, user.company_id, user.id)}


@router.get("/requisitions", summary="List job requisitions")
def list_requisitions(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.list_requisitions(db, user.company_id)}


@router.post("/requisitions/{req_id}/approve", summary="Approve or reject a requisition (§8)")
def approve_requisition(
    req_id: str,
    payload: RequisitionApprovePayload,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    approve = payload.status == "approved"
    return {"success": True, "data": RecruitmentService.approve_requisition(db, req_id, approve, user.company_id)}


@router.post("/requisitions/{req_id}/hiring-team", summary="Assign hiring team to requisition (§15)")
def manage_hiring_team(
    req_id: str,
    payload: HiringTeamSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.manage_hiring_team(db, req_id, payload, user.company_id)}


@router.get("/requisitions/{req_id}/hiring-team", summary="Get hiring team for requisition (§15)")
def get_hiring_team(req_id: str, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.manage_hiring_team(
        db, req_id, HiringTeamSchema(userIds=[], role="recruiter"), user.company_id
    )}


# ═══════════════════════════════════════════════════════════════════════════════
# JOB POSTINGS  §9
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/jobs", status_code=status.HTTP_201_CREATED, summary="Create / publish job posting")
def create_job_posting(
    payload: JobPostingCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.create_job_posting(db, payload, user.company_id)}


@router.get("/jobs", summary="List all job postings")
def list_job_postings(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.list_job_postings(db, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# RESUME PARSING  §22
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/parse-resume", status_code=status.HTTP_201_CREATED, summary="AI structured resume parsing (§22)")
def parse_resume(
    payload: ResumeParseSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.parse_resume(db, payload, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# CANDIDATE MANAGEMENT  §20, §24, §25
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/apply", status_code=status.HTTP_201_CREATED, summary="Submit candidate application")
def apply(
    payload: CandidateApplySchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.apply(db, payload, user.company_id)}


@router.get("/candidates", summary="List candidates with optional status filter")
def list_candidates(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.list_candidates(db, user.company_id, status)}


@router.get("/candidates/search", summary="Fuzzy search candidates with filters and pagination (§24)")
def search_candidates(
    q: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    department: Optional[str] = None,
    minAtsScore: Optional[int] = None,
    maxAtsScore: Optional[int] = None,
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    filters = CandidateSearchSchema(
        q=q, status=status, source=source, department=department,
        minAtsScore=minAtsScore, maxAtsScore=maxAtsScore,
        page=page, pageSize=pageSize
    )
    return {"success": True, "data": RecruitmentService.search_candidates(db, filters, user.company_id)}


@router.get("/candidates/{candidate_id}", summary="Get full candidate profile")
def get_candidate(candidate_id: str, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.get_candidate(db, candidate_id, user.company_id)}


@router.post("/candidates/move-pipeline", summary="Move candidate to next pipeline stage (§25)")
def move_pipeline(
    payload: CandidatePipelineMoveSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.move_pipeline(db, payload, user.company_id, user.email)}


@router.post("/candidates/{candidate_id}/reject", summary="Reject candidate with reason")
def reject_candidate(
    candidate_id: str,
    reason: str = "Not suitable",
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.reject_candidate(db, candidate_id, reason, user.company_id, user.email)}


@router.get("/candidates/{candidate_id}/timeline", summary="Get candidate audit timeline")
def get_timeline(candidate_id: str, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.get_candidate_timeline(db, candidate_id, user.company_id)}


# ── Candidate References  §44 ─────────────────────────────────────────────────

@router.post("/candidates/{candidate_id}/references", status_code=status.HTTP_201_CREATED, summary="Add candidate reference contact (§44)")
def add_reference(
    candidate_id: str,
    payload: CandidateReferenceSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    payload.candidateId = candidate_id
    return {"success": True, "data": RecruitmentService.add_reference(db, payload, user.company_id)}


@router.get("/candidates/{candidate_id}/references", summary="List candidate references")
def list_references(candidate_id: str, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.list_references(db, candidate_id, user.company_id)}


@router.post("/references/verify", summary="Record reference check outcome (§44)")
def verify_reference(
    payload: ReferenceCheckUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.update_reference_check(db, payload, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# ATS SCORING  §23
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/ats-score", summary="Calculate ATS score for a candidate vs job posting (§23)")
def ats_score(
    payload: ATSScoringRequestSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.calculate_ats_score(db, payload, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# INTERVIEWS  §28, §29
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/interview", status_code=status.HTTP_201_CREATED, summary="Schedule an interview (§28)")
def schedule_interview(
    payload: InterviewScheduleSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.schedule_interview(db, payload, user.company_id, user.email)}


@router.post("/interview/reschedule", summary="Reschedule an interview (§28)")
def reschedule_interview(
    payload: InterviewRescheduleSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.reschedule_interview(db, payload, user.company_id, user.email)}


@router.get("/interviews", summary="List interviews")
def list_interviews(
    candidate_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.list_interviews(db, candidate_id, user.company_id)}


@router.post("/interview/feedback", status_code=status.HTTP_201_CREATED, summary="Submit interview feedback (§29)")
def submit_feedback(
    payload: InterviewFeedbackSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.submit_feedback(db, payload, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# OFFERS  §37–§42
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/offer", status_code=status.HTTP_201_CREATED, summary="Create offer letter (§37)")
def create_offer(
    payload: OfferCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.create_offer(db, payload, user.company_id, user.email)}


@router.get("/offers", summary="List all offers")
def list_offers(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.list_offers(db, user.company_id)}


@router.post("/offers/approve", summary="Approve or reject offer (§41)")
def approve_offer(
    payload: OfferApproveSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.approve_offer(db, payload, user.company_id, user.email)}


@router.post("/offers/{offer_id}/respond", summary="Candidate response: accept/reject/negotiate/withdraw (§42)")
def respond_offer(
    offer_id: str,
    payload: OfferRespondPayload,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.respond_offer(db, offer_id, payload.response, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND VERIFICATION  §43
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/background-check", status_code=status.HTTP_201_CREATED, summary="Update background verification checks (§43)")
def update_bgv(
    payload: BackgroundCheckSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.update_background_check(db, payload, user.company_id)}


@router.get("/background-check/{candidate_id}", summary="Get background verification status")
def get_bgv(candidate_id: str, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.get_background_check(db, candidate_id, user.company_id)}


# ═══════════════════════════════════════════════════════════════════════════════
# HRMS CONVERSION  §50
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/convert-to-employee", status_code=status.HTTP_201_CREATED, summary="Convert accepted candidate to HRMS employee (§50)")
def convert_to_employee(
    payload: CandidateConvertSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.convert_to_employee(db, payload, user.company_id, user.email)}


@router.post("/convert", status_code=status.HTTP_201_CREATED, summary="Convert accepted candidate alias")
def convert_alias(
    payload: CandidateConvertSchema,
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.convert_to_employee(db, payload, user.company_id, user.email)}


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS & REPORTS  §47, §51
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/analytics", summary="Full recruitment KPI analytics (§47, §49)")
def get_analytics(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.get_analytics(db, user.company_id)}


@router.get("/reports", summary="Standard recruitment reports (§51)")
def get_reports(
    report_type: str = Query(
        default="pipeline",
        description="pipeline | offer | source | interview | candidate_status"
    ),
    db: Session = Depends(get_db),
    user: User = Depends(verify_tenant)
):
    return {"success": True, "data": RecruitmentService.get_reports(db, user.company_id, report_type)}


@router.get("/dashboard", summary="Recruitment dashboard with all KPIs (§48)")
def get_dashboard(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": RecruitmentService.get_dashboard(db, user.company_id)}
