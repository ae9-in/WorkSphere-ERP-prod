from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.performance import PerformanceService
from app.schemas.performance import (
    PerformanceCycleCreate, GoalCreateSchema, GoalProgressUpdateSchema,
    PerformanceReviewSubmitSchema, Feedback360SubmitSchema, PIPRecordCreateSchema,
    PromotionNominationSchema, RecognitionAwardSchema, CalibrationUpdateSchema,
    SuccessionPlanCreateSchema
)

router = APIRouter(prefix="/performance", tags=["performance"])

@router.get("")
def get_performance_summary(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    cycles = PerformanceService.get_cycles(db, tenant_id=tenant_id)
    goals = PerformanceService.get_goals(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": {
            "cycles": cycles,
            "goals": goals
        }
    }

@router.post("/cycles", status_code=201)
def create_cycle(payload: PerformanceCycleCreate, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.create_cycle(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/goals")
def get_goals(employeeId: Optional[str] = Query(None), user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.get_goals(db, tenant_id=tenant_id, employee_id=employeeId)
    return {
        "success": True,
        "data": result
    }

@router.post("/goals", status_code=201)
def create_goal(payload: GoalCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.create_goal(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.patch("/goals/{id}/progress")
def update_goal_progress(id: str, payload: GoalProgressUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.update_goal_progress(db, goal_id=id, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/reviews", status_code=201)
def submit_review(payload: PerformanceReviewSubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.submit_review(db, payload=payload, tenant_id=tenant_id, author_employee_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/feedback", status_code=201)
def submit_feedback(payload: Feedback360SubmitSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.submit_feedback(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/pip", status_code=201)
def create_pip(payload: PIPRecordCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.create_pip(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/promotions", status_code=201)
def nominate_promotion(payload: PromotionNominationSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.nominate_promotion(db, payload=payload, tenant_id=tenant_id, author_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/recognition", status_code=201)
def award_recognition(payload: RecognitionAwardSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.award_recognition(db, payload=payload, tenant_id=tenant_id, author_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/calibration")
def calibrate_review(payload: CalibrationUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.calibrate_review(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/succession")
def get_succession_plans(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.get_succession_plans(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/succession", status_code=201)
def create_succession_plan(payload: SuccessionPlanCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = PerformanceService.create_succession_plan(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/dashboard")
def get_dashboard_summary(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    goals = PerformanceService.get_goals(db, tenant_id=tenant_id)
    successions = PerformanceService.get_succession_plans(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": {
            "goalsCount": len(goals),
            "successionPlansCount": len(successions)
        }
    }

@router.get("/analytics")
def get_analytics(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    return {
        "success": True,
        "data": {
            "ratingsDistribution": [
                {"rating": 5, "count": 2},
                {"rating": 4, "count": 5},
                {"rating": 3, "count": 3}
            ]
        }
    }
