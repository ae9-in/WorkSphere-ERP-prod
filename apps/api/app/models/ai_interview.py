import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel

class AIInterviewSession(TenantBaseModel):
    __tablename__ = "ai_interview_sessions"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_posting_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, in_progress, completed, failed
    overall_score = Column(Float, nullable=True)
    summary = Column(String, nullable=True)
    transcript_json = Column(JSON, default=list, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    questions = orm_relationship("AIInterviewQuestion", back_populates="session", cascade="all, delete-orphan")
    responses = orm_relationship("AIInterviewResponse", back_populates="session", cascade="all, delete-orphan")

class AIInterviewQuestion(TenantBaseModel):
    __tablename__ = "ai_interview_questions"

    session_id = Column(UUID(as_uuid=True), ForeignKey("ai_interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(String, nullable=False)
    category = Column(String, nullable=False) # technical, situational, behavioral
    target_duration = Column(Integer, default=120, nullable=False) # seconds

    session = orm_relationship("AIInterviewSession", back_populates="questions")
    responses = orm_relationship("AIInterviewResponse", back_populates="question", cascade="all, delete-orphan")

class AIInterviewResponse(TenantBaseModel):
    __tablename__ = "ai_interview_responses"

    session_id = Column(UUID(as_uuid=True), ForeignKey("ai_interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("ai_interview_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    response_text = Column(String, nullable=True)
    duration_taken = Column(Integer, nullable=True) # seconds
    confidence_score = Column(Float, nullable=True) # AI analysis metric
    sentiment_score = Column(Float, nullable=True) # AI analysis metric
    correctness_score = Column(Float, nullable=True) # AI analysis metric
    evaluation_notes = Column(String, nullable=True)

    session = orm_relationship("AIInterviewSession", back_populates="responses")
    question = orm_relationship("AIInterviewQuestion", back_populates="responses")
