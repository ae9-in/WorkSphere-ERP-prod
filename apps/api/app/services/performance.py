from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.models.performance import (
    PerformanceCycle, Goal, KeyResult, PerformanceReview,
    Feedback360, PIPRecord, PerformancePromotion, PerformanceRecognition,
    SuccessionPlan, PerformanceTimeline, PerformanceTemplate
)
from app.models.employee import Employee
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.performance import (
    PerformanceCycleCreate, GoalCreateSchema, GoalProgressUpdateSchema,
    PerformanceReviewSubmitSchema, Feedback360SubmitSchema, PIPRecordCreateSchema,
    PromotionNominationSchema, RecognitionAwardSchema, CalibrationUpdateSchema,
    SuccessionPlanCreateSchema
)

def serialize_cycle(cycle: PerformanceCycle) -> dict:
    return {
        "_id": str(cycle.id),
        "name": cycle.name,
        "type": cycle.type,
        "startDate": cycle.start_date.isoformat(),
        "endDate": cycle.end_date.isoformat(),
        "status": cycle.status
    }

def serialize_goal(goal: Goal) -> dict:
    return {
        "_id": str(goal.id),
        "employeeId": str(goal.employee_id),
        "cycleId": str(goal.cycle_id) if goal.cycle_id else None,
        "title": goal.title,
        "description": goal.description,
        "type": goal.type,
        "weightage": goal.weightage,
        "targetValue": goal.target_value,
        "currentValue": goal.current_value,
        "unit": goal.unit,
        "startDate": goal.start_date.isoformat(),
        "endDate": goal.end_date.isoformat(),
        "status": goal.status,
        "keyResults": [
            {
                "title": kr.title,
                "description": kr.description,
                "targetValue": kr.target_value,
                "currentValue": kr.current_value,
                "weightage": kr.weightage
            } for kr in goal.key_results
        ]
    }

class PerformanceService:
    @staticmethod
    def create_cycle(db: Session, payload: PerformanceCycleCreate, tenant_id: uuid.UUID) -> dict:
        cycle = PerformanceCycle(
            tenant_id=tenant_id,
            name=payload.name,
            type=payload.type,
            start_date=payload.startDate,
            end_date=payload.endDate,
            status="active"
        )
        db.add(cycle)
        db.commit()
        db.refresh(cycle)
        return serialize_cycle(cycle)

    @staticmethod
    def get_cycles(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        cycles = db.query(PerformanceCycle).filter(PerformanceCycle.tenant_id == tenant_id).all()
        return [serialize_cycle(c) for c in cycles]

    @staticmethod
    def create_goal(db: Session, payload: GoalCreateSchema, tenant_id: uuid.UUID) -> dict:
        try:
            emp_uuid = uuid.UUID(payload.employeeId)
        except ValueError:
            emp = db.query(Employee).filter(Employee.employee_id == payload.employeeId, Employee.tenant_id == tenant_id).first()
            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")
            emp_uuid = emp.id

        cycle_uuid = uuid.UUID(payload.cycleId) if payload.cycleId else None

        goal = Goal(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            cycle_id=cycle_uuid,
            title=payload.title,
            description=payload.description,
            type=payload.type,
            weightage=payload.weightage,
            target_value=payload.targetValue,
            current_value=0.0,
            unit=payload.unit,
            start_date=payload.startDate,
            end_date=payload.endDate,
            status="in_progress"
        )
        db.add(goal)
        db.flush()

        if payload.keyResults:
            for kr in payload.keyResults:
                new_kr = KeyResult(
                    goal_id=goal.id,
                    tenant_id=tenant_id,
                    title=kr.title,
                    description=kr.description,
                    target_value=kr.targetValue,
                    current_value=0.0,
                    weightage=kr.weightage
                )
                db.add(new_kr)

        # Log performance timeline
        timeline = PerformanceTimeline(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            event_type="goal_assigned",
            title="Goal Assigned",
            description=f"Goal '{payload.title}' assigned to employee.",
            event_date=datetime.utcnow()
        )
        db.add(timeline)

        db.commit()
        db.refresh(goal)
        return serialize_goal(goal)

    @staticmethod
    def update_goal_progress(db: Session, goal_id: str, payload: GoalProgressUpdateSchema, tenant_id: uuid.UUID) -> dict:
        goal_uuid = uuid.UUID(goal_id)
        goal = db.query(Goal).filter(Goal.id == goal_uuid, Goal.tenant_id == tenant_id).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        goal.current_value = payload.currentValue
        if goal.current_value >= goal.target_value:
            goal.status = "achieved"
        else:
            goal.status = "in_progress"

        timeline = PerformanceTimeline(
            tenant_id=tenant_id,
            employee_id=goal.employee_id,
            event_type="progress_updated",
            title="Goal Progress Updated",
            description=f"Goal '{goal.title}' progress set to {payload.currentValue}.",
            event_date=datetime.utcnow()
        )
        db.add(timeline)

        db.commit()
        db.refresh(goal)
        return serialize_goal(goal)

    @staticmethod
    def get_goals(db: Session, tenant_id: uuid.UUID, employee_id: Optional[str] = None) -> List[dict]:
        query = db.query(Goal).filter(Goal.tenant_id == tenant_id)
        if employee_id:
            try:
                emp_uuid = uuid.UUID(employee_id)
                query = query.filter(Goal.employee_id == emp_uuid)
            except ValueError:
                emp = db.query(Employee).filter(Employee.employee_id == employee_id, Employee.tenant_id == tenant_id).first()
                if emp:
                    query = query.filter(Goal.employee_id == emp.id)
        
        goals = query.all()
        return [serialize_goal(g) for g in goals]

    @staticmethod
    def submit_review(db: Session, payload: PerformanceReviewSubmitSchema, tenant_id: uuid.UUID, author_employee_id: uuid.UUID) -> dict:
        cycle_uuid = uuid.UUID(payload.cycleId)
        
        # Get active template (default first template, or seed if missing)
        template = db.query(PerformanceTemplate).filter(PerformanceTemplate.tenant_id == tenant_id).first()
        if not template:
            template = PerformanceTemplate(
                tenant_id=tenant_id,
                name="Standard Performance Evaluation",
                criteria={"overall": "Standard review metrics"}
            )
            db.add(template)
            db.flush()

        review = db.query(PerformanceReview).filter(
            PerformanceReview.employee_id == author_employee_id,
            PerformanceReview.cycle_id == cycle_uuid,
            PerformanceReview.tenant_id == tenant_id
        ).first()

        if not review:
            review = PerformanceReview(
                tenant_id=tenant_id,
                employee_id=author_employee_id,
                cycle_id=cycle_uuid,
                template_id=template.id,
                status="draft"
            )
            db.add(review)
            db.flush()

        if payload.selfRating is not None:
            review.self_rating = payload.selfRating
            review.self_comments = payload.selfComments
            review.status = "self_submitted"
            review.submitted_at = datetime.utcnow()
        
        if payload.managerRating is not None:
            review.manager_rating = payload.managerRating
            review.manager_comments = payload.managerComments
            review.status = "manager_reviewed"
            review.reviewed_at = datetime.utcnow()

        timeline = PerformanceTimeline(
            tenant_id=tenant_id,
            employee_id=author_employee_id,
            event_type="review_submitted",
            title="Review Submitted",
            description=f"Performance review updated. Status: {review.status}.",
            event_date=datetime.utcnow()
        )
        db.add(timeline)

        db.commit()
        db.refresh(review)
        return {
            "_id": str(review.id),
            "employeeId": str(review.employee_id),
            "cycleId": str(review.cycle_id),
            "selfRating": review.self_rating,
            "selfComments": review.self_comments,
            "managerRating": review.manager_rating,
            "managerComments": review.manager_comments,
            "status": review.status
        }

    @staticmethod
    def submit_feedback(db: Session, payload: Feedback360SubmitSchema, tenant_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        cycle_uuid = uuid.UUID(payload.cycleId)
        rev_uuid = uuid.UUID(payload.reviewerId)

        feedback = Feedback360(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            cycle_id=cycle_uuid,
            reviewer_id=rev_uuid,
            relationship=payload.relationship,
            rating=payload.rating,
            comments=payload.comments,
            status="submitted"
        )
        db.add(feedback)
        
        timeline = PerformanceTimeline(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            event_type="award_received",
            title="Peer Feedback Received",
            description="360 peer feedback has been submitted.",
            event_date=datetime.utcnow()
        )
        db.add(timeline)

        db.commit()
        db.refresh(feedback)
        return {
            "_id": str(feedback.id),
            "employeeId": str(feedback.employee_id),
            "cycleId": str(feedback.cycle_id),
            "rating": feedback.rating,
            "comments": feedback.comments,
            "status": feedback.status
        }

    @staticmethod
    def create_pip(db: Session, payload: PIPRecordCreateSchema, tenant_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        pip = PIPRecord(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            start_date=payload.startDate,
            end_date=payload.endDate,
            expected_outcomes=payload.expectedOutcomes,
            status="active"
        )
        db.add(pip)
        
        timeline = PerformanceTimeline(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            event_type="pip_initiated",
            title="PIP Initiated",
            description="Performance Improvement Plan (PIP) has been started.",
            event_date=datetime.utcnow()
        )
        db.add(timeline)

        db.commit()
        db.refresh(pip)
        return {
            "_id": str(pip.id),
            "employeeId": str(pip.employee_id),
            "startDate": pip.start_date.isoformat(),
            "endDate": pip.end_date.isoformat(),
            "expectedOutcomes": pip.expected_outcomes,
            "status": pip.status
        }

    @staticmethod
    def nominate_promotion(db: Session, payload: PromotionNominationSchema, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        promo = PerformancePromotion(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            nominated_by=author_id,
            target_designation=payload.targetDesignation,
            proposed_ctc=payload.proposedCtc,
            justification=payload.justification,
            status="pending"
        )
        db.add(promo)
        
        db.commit()
        db.refresh(promo)
        return {
            "_id": str(promo.id),
            "employeeId": str(promo.employee_id),
            "targetDesignation": promo.target_designation,
            "proposedCtc": promo.proposed_ctc,
            "status": promo.status
        }

    @staticmethod
    def award_recognition(db: Session, payload: RecognitionAwardSchema, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        award = PerformanceRecognition(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            giver_id=author_id,
            award_type=payload.awardType,
            citation=payload.citation
        )
        db.add(award)
        
        db.commit()
        db.refresh(award)
        return {
            "_id": str(award.id),
            "employeeId": str(award.employee_id),
            "awardType": award.award_type,
            "citation": award.citation
        }

    @staticmethod
    def calibrate_review(db: Session, payload: CalibrationUpdateSchema, tenant_id: uuid.UUID) -> dict:
        review_uuid = uuid.UUID(payload.reviewId)
        review = db.query(PerformanceReview).filter(
            PerformanceReview.id == review_uuid,
            PerformanceReview.tenant_id == tenant_id
        ).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        review.calibrated_rating = payload.calibratedRating
        review.calibration_comments = payload.calibrationComments
        review.status = "calibrated"

        db.commit()
        db.refresh(review)
        return {
            "_id": str(review.id),
            "calibratedRating": review.calibrated_rating,
            "calibrationComments": review.calibration_comments,
            "status": review.status
        }

    @staticmethod
    def create_succession_plan(db: Session, payload: SuccessionPlanCreateSchema, tenant_id: uuid.UUID) -> dict:
        successor_uuid = uuid.UUID(payload.successorId)
        incumbent_uuid = uuid.UUID(payload.incumbentId) if payload.incumbentId else None

        plan = SuccessionPlan(
            tenant_id=tenant_id,
            position_name=payload.positionName,
            incumbent_id=incumbent_uuid,
            successor_id=successor_uuid,
            readiness=payload.readiness,
            performance_rating=payload.performanceRating,
            potential_rating=payload.potentialRating,
            development_needs=payload.developmentNeeds
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return {
            "_id": str(plan.id),
            "positionName": plan.position_name,
            "successorId": str(plan.successor_id),
            "readiness": plan.readiness
        }

    @staticmethod
    def get_succession_plans(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        plans = db.query(SuccessionPlan).filter(SuccessionPlan.tenant_id == tenant_id).all()
        return [
            {
                "_id": str(p.id),
                "positionName": p.position_name,
                "successorId": str(p.successor_id),
                "readiness": p.readiness,
                "performanceRating": p.performance_rating,
                "potentialRating": p.potential_rating
            } for p in plans
        ]
