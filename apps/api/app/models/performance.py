import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel

class PerformanceCycle(TenantBaseModel):
    __tablename__ = "performance_cycles"

    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # annual, half_yearly, quarterly, monthly, custom
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, default="active", nullable=False) # active, closed, draft

class PerformanceTemplate(TenantBaseModel):
    __tablename__ = "performance_templates"

    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    goals_weight = Column(Float, default=60.0, nullable=False)
    competencies_weight = Column(Float, default=40.0, nullable=False)
    rating_scale = Column(String, default="1-5", nullable=False) # 1-5, 1-10, grade
    criteria = Column(JSON, default=dict, nullable=False)

class Goal(TenantBaseModel):
    __tablename__ = "goals"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_id = Column(UUID(as_uuid=True), ForeignKey("performance_cycles.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    type = Column(String, default="individual", nullable=False) # individual, team, department, company
    weightage = Column(Float, default=1.0, nullable=False)
    target_value = Column(Float, default=100.0, nullable=False)
    current_value = Column(Float, default=0.0, nullable=False)
    unit = Column(String, default="percentage", nullable=False) # percentage, currency, count
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, in_progress, achieved, missed

    key_results = orm_relationship("KeyResult", back_populates="goal", cascade="all, delete-orphan")

class KeyResult(TenantBaseModel):
    __tablename__ = "key_results"

    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    target_value = Column(Float, default=100.0, nullable=False)
    current_value = Column(Float, default=0.0, nullable=False)
    weightage = Column(Float, default=1.0, nullable=False)

    goal = orm_relationship("Goal", back_populates="key_results")

class Competency(TenantBaseModel):
    __tablename__ = "competencies"

    name = Column(String, nullable=False)
    category = Column(String, nullable=False) # technical, leadership, communication, problem_solving, teamwork
    description = Column(String, nullable=True)

class CompetencyScore(TenantBaseModel):
    __tablename__ = "competency_scores"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_id = Column(UUID(as_uuid=True), ForeignKey("performance_cycles.id", ondelete="CASCADE"), nullable=False)
    competency_id = Column(UUID(as_uuid=True), ForeignKey("competencies.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Float, nullable=False)
    evaluator_role = Column(String, nullable=False) # self, manager, peer

class PerformanceReview(TenantBaseModel):
    __tablename__ = "performance_reviews"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_id = Column(UUID(as_uuid=True), ForeignKey("performance_cycles.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("performance_templates.id", ondelete="SET NULL"), nullable=True)
    
    self_rating = Column(Float, nullable=True)
    self_comments = Column(String, nullable=True)
    
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    manager_rating = Column(Float, nullable=True)
    manager_comments = Column(String, nullable=True)
    
    calibrated_rating = Column(Float, nullable=True)
    calibration_comments = Column(String, nullable=True)
    
    status = Column(String, default="draft", nullable=False) # draft, self_submitted, manager_reviewed, calibrated, published
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

class Feedback360(TenantBaseModel):
    __tablename__ = "feedback_360"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_id = Column(UUID(as_uuid=True), ForeignKey("performance_cycles.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    relationship = Column(String, nullable=False) # peer, direct_report, manager, stakeholder
    is_anonymous = Column(Boolean, default=True, nullable=False)
    
    rating = Column(Float, nullable=False)
    comments = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, submitted

class PerformanceJournal(TenantBaseModel):
    __tablename__ = "performance_journals"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    entry = Column(String, nullable=False)
    category = Column(String, default="achievement", nullable=False) # achievement, learning, challenge, feedback
    is_shared = Column(Boolean, default=False, nullable=False)

class PIPRecord(TenantBaseModel):
    __tablename__ = "pip_records"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    expected_outcomes = Column(String, nullable=False)
    coaching_notes = Column(JSON, default=list, nullable=True)
    status = Column(String, default="active", nullable=False) # active, extended, completed_successful, completed_unsuccessful
    final_assessment = Column(String, nullable=True)

class PerformancePromotion(TenantBaseModel):
    __tablename__ = "performance_promotions"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    nominated_by = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    target_designation = Column(String, nullable=False)
    proposed_ctc = Column(Float, nullable=False)
    justification = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

class PerformanceRecognition(TenantBaseModel):
    __tablename__ = "performance_recognitions"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    giver_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    award_type = Column(String, nullable=False) # spot_award, employee_of_the_month, team_award, innovation_award, customer_appreciation
    citation = Column(String, nullable=False)
    awarded_date = Column(DateTime, default=datetime.utcnow, nullable=False)

class SuccessionPlan(TenantBaseModel):
    __tablename__ = "succession_plans"

    position_name = Column(String, nullable=False, index=True)
    incumbent_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    successor_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    readiness = Column(String, default="ready_now", nullable=False) # ready_now, ready_1_2_years, ready_3_5_years
    performance_rating = Column(Float, nullable=True) # visual representation matching
    potential_rating = Column(Float, nullable=True) # potential measurement (high, medium, low)
    development_needs = Column(String, nullable=True)

class PerformanceTimeline(TenantBaseModel):
    __tablename__ = "performance_timelines"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False) # goal_assigned, progress_updated, review_submitted, pip_initiated, award_received
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    performed_by = Column(String, nullable=True)
