from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.models.assessment_engine import AssessmentTemplate, AssessmentAttempt
from app.models.recruitment import Candidate
from app.schemas.assessment import (
    AssessmentTemplateCreateSchema, AssessmentAttemptStartSchema,
    AssessmentAttemptSubmitSchema
)

def serialize_template(tpl: AssessmentTemplate) -> dict:
    return {
        "_id": str(tpl.id),
        "title": tpl.title,
        "description": tpl.description,
        "category": tpl.category,
        "durationMinutes": tpl.duration_minutes,
        "passingScore": tpl.passing_score,
        "questions": tpl.questions_json
    }

def serialize_attempt(att: AssessmentAttempt) -> dict:
    return {
        "_id": str(att.id),
        "templateId": str(att.template_id),
        "candidateId": str(att.candidate_id),
        "status": att.status,
        "score": att.score,
        "answers": att.answers_json,
        "startedAt": att.started_at.isoformat() if att.started_at else None,
        "completedAt": att.completed_at.isoformat() if att.completed_at else None
    }

class AssessmentService:
    @staticmethod
    def create_template(db: Session, payload: AssessmentTemplateCreateSchema, tenant_id: uuid.UUID) -> dict:
        tpl = AssessmentTemplate(
            tenant_id=tenant_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            duration_minutes=payload.durationMinutes,
            passing_score=payload.passingScore,
            questions_json=payload.questionsJson
        )
        db.add(tpl)
        db.commit()
        db.refresh(tpl)
        return serialize_template(tpl)

    @staticmethod
    def list_templates(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        templates = db.query(AssessmentTemplate).filter(AssessmentTemplate.tenant_id == tenant_id).all()
        return [serialize_template(t) for t in templates]

    @staticmethod
    def start_attempt(db: Session, payload: AssessmentAttemptStartSchema, tenant_id: uuid.UUID) -> dict:
        tpl_uuid = uuid.UUID(payload.templateId)
        cand_uuid = uuid.UUID(payload.candidateId)

        tpl = db.query(AssessmentTemplate).filter(AssessmentTemplate.id == tpl_uuid, AssessmentTemplate.tenant_id == tenant_id).first()
        if not tpl:
            raise HTTPException(status_code=404, detail="Assessment template not found")

        attempt = AssessmentAttempt(
            tenant_id=tenant_id,
            template_id=tpl_uuid,
            candidate_id=cand_uuid,
            status="started",
            started_at=datetime.utcnow()
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return serialize_attempt(attempt)

    @staticmethod
    def submit_attempt(db: Session, attempt_id: str, payload: AssessmentAttemptSubmitSchema, tenant_id: uuid.UUID) -> dict:
        att_uuid = uuid.UUID(attempt_id)
        attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == att_uuid,
            AssessmentAttempt.tenant_id == tenant_id
        ).first()
        if not attempt:
            raise HTTPException(status_code=404, detail="Assessment attempt not found")

        tpl = db.query(AssessmentTemplate).filter(AssessmentTemplate.id == attempt.template_id).first()
        if not tpl:
            raise HTTPException(status_code=404, detail="Assessment template not found")

        # Evaluate answers
        correct_count = 0
        total_questions = len(tpl.questions_json)
        answers = payload.answersJson

        for q in tpl.questions_json:
            q_id = q.get("id")
            correct_val = q.get("correctAnswer")
            submitted_val = answers.get(str(q_id))
            if submitted_val == correct_val:
                correct_count += 1

        score = round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0.0

        attempt.score = score
        attempt.answers_json = answers
        attempt.status = "graded"
        attempt.completed_at = datetime.utcnow()

        # Update candidate status in recruitment if they pass
        candidate = db.query(Candidate).filter(Candidate.id == attempt.candidate_id).first()
        if candidate and score >= tpl.passing_score:
            candidate.ats_score = int(score) # Update ATS score with assessment performance!
            candidate.status = "technical_interview" # Advance to technical interview!

        db.commit()
        db.refresh(attempt)
        return serialize_attempt(attempt)

    @staticmethod
    def get_attempts_by_candidate(db: Session, candidate_id: str, tenant_id: uuid.UUID) -> List[dict]:
        cand_uuid = uuid.UUID(candidate_id)
        attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.candidate_id == cand_uuid,
            AssessmentAttempt.tenant_id == tenant_id
        ).all()
        return [serialize_attempt(a) for a in attempts]
