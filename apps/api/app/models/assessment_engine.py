import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel

class AssessmentTemplate(TenantBaseModel):
    __tablename__ = "assessment_templates"

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, default="coding", nullable=False) # coding, aptitude, mcq, domain, personality
    duration_minutes = Column(Integer, default=60, nullable=False)
    passing_score = Column(Float, default=70.0, nullable=False)
    questions_json = Column(JSON, default=list, nullable=False) # list of questions, options, correct answers

    attempts = orm_relationship("AssessmentAttempt", back_populates="template", cascade="all, delete-orphan")

class AssessmentAttempt(TenantBaseModel):
    __tablename__ = "assessment_attempts"

    template_id = Column(UUID(as_uuid=True), ForeignKey("assessment_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="pending", nullable=False) # pending, started, submitted, graded
    score = Column(Float, nullable=True)
    answers_json = Column(JSON, default=dict, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    template = orm_relationship("AssessmentTemplate", back_populates="attempts")
