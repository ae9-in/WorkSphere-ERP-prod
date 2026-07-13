from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
import random
from typing import Optional, Dict, Any, List

from app.models.ai_interview import AIInterviewSession, AIInterviewQuestion, AIInterviewResponse
from app.models.recruitment import Candidate, JobPosting
from app.models.audit import AuditLog
from app.schemas.ai_interview import (
    AIInterviewSessionCreateSchema, AIInterviewResponseSubmitSchema,
    AIInterviewSessionUpdateSchema
)

def serialize_session(session: AIInterviewSession) -> dict:
    return {
        "_id": str(session.id),
        "candidateId": str(session.candidate_id),
        "jobPostingId": str(session.job_posting_id),
        "status": session.status,
        "overallScore": session.overall_score,
        "summary": session.summary,
        "questions": [
            {
                "_id": str(q.id),
                "questionText": q.question_text,
                "category": q.category,
                "targetDuration": q.target_duration
            } for q in session.questions
        ],
        "responses": [
            {
                "questionId": str(r.question_id),
                "responseText": r.response_text,
                "correctnessScore": r.correctness_score,
                "confidenceScore": r.confidence_score,
                "sentimentScore": r.sentiment_score
            } for r in session.responses
        ]
    }

class AIInterviewService:
    @staticmethod
    def create_session(db: Session, payload: AIInterviewSessionCreateSchema, tenant_id: uuid.UUID) -> dict:
        cand_uuid = uuid.UUID(payload.candidateId)
        job_uuid = uuid.UUID(payload.jobPostingId)

        session = AIInterviewSession(
            tenant_id=tenant_id,
            candidate_id=cand_uuid,
            job_posting_id=job_uuid,
            status="in_progress",
            started_at=datetime.utcnow()
        )
        db.add(session)
        db.flush()

        # Seed mock AI generated questions
        questions = [
            AIInterviewQuestion(
                tenant_id=tenant_id,
                session_id=session.id,
                question_text="Explain the difference between SQL and NoSQL databases, and when you would choose one over the other.",
                category="technical",
                target_duration=120
            ),
            AIInterviewQuestion(
                tenant_id=tenant_id,
                session_id=session.id,
                question_text="Describe a time when you had to resolve a conflict within your development team. What was the outcome?",
                category="behavioral",
                target_duration=90
            ),
            AIInterviewQuestion(
                tenant_id=tenant_id,
                session_id=session.id,
                question_text="If our production servers crashed during a high-traffic release, what initial debugging steps would you perform?",
                category="situational",
                target_duration=180
            )
        ]
        db.add_all(questions)
        db.commit()
        db.refresh(session)
        return serialize_session(session)

    @staticmethod
    def submit_response(db: Session, session_id: str, payload: AIInterviewResponseSubmitSchema, tenant_id: uuid.UUID) -> dict:
        sess_uuid = uuid.UUID(session_id)
        q_uuid = uuid.UUID(payload.questionId)

        session = db.query(AIInterviewSession).filter(
            AIInterviewSession.id == sess_uuid,
            AIInterviewSession.tenant_id == tenant_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="AI Interview session not found")

        # Mock AI evaluation metrics
        confidence = round(random.uniform(0.75, 0.98), 2)
        sentiment = round(random.uniform(0.60, 0.95), 2)
        
        # Base correctness on response length and keyword matching
        length = len(payload.responseText.strip())
        if length > 100:
            correctness = round(random.uniform(8.0, 10.0), 1)
            notes = "Comprehensive answer demonstrating clear technical awareness."
        elif length > 40:
            correctness = round(random.uniform(5.5, 7.9), 1)
            notes = "Moderately complete answer but could benefit from deeper examples."
        else:
            correctness = round(random.uniform(2.0, 5.4), 1)
            notes = "Short response lacking necessary technical depth."

        response = AIInterviewResponse(
            tenant_id=tenant_id,
            session_id=sess_uuid,
            question_id=q_uuid,
            response_text=payload.responseText,
            duration_taken=payload.durationTaken,
            confidence_score=confidence,
            sentiment_score=sentiment,
            correctness_score=correctness,
            evaluation_notes=notes
        )
        db.add(response)
        db.commit()
        return {
            "correctnessScore": correctness,
            "confidenceScore": confidence,
            "sentimentScore": sentiment,
            "evaluationNotes": notes
        }

    @staticmethod
    def complete_session(db: Session, session_id: str, tenant_id: uuid.UUID) -> dict:
        sess_uuid = uuid.UUID(session_id)
        session = db.query(AIInterviewSession).filter(
            AIInterviewSession.id == sess_uuid,
            AIInterviewSession.tenant_id == tenant_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="AI Interview session not found")

        responses = db.query(AIInterviewResponse).filter(AIInterviewResponse.session_id == sess_uuid).all()
        if not responses:
            overall_score = 0.0
            summary = "No responses submitted."
        else:
            overall_score = round(sum(r.correctness_score for r in responses) / len(responses), 1)
            summary = f"Completed with overall correctness rating of {overall_score}/10."

        session.overall_score = overall_score
        session.summary = summary
        session.status = "completed"
        session.completed_at = datetime.utcnow()

        db.commit()
        db.refresh(session)
        return serialize_session(session)

    @staticmethod
    def get_session(db: Session, session_id: str, tenant_id: uuid.UUID) -> dict:
        sess_uuid = uuid.UUID(session_id)
        session = db.query(AIInterviewSession).filter(
            AIInterviewSession.id == sess_uuid,
            AIInterviewSession.tenant_id == tenant_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="AI Interview session not found")
        return serialize_session(session)
