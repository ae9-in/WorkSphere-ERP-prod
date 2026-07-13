from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class PerformanceCycleCreate(BaseModel):
    name: str
    type: str  # annual, half_yearly, quarterly, monthly, custom
    startDate: datetime
    endDate: datetime

class KeyResultSchema(BaseModel):
    title: str
    description: Optional[str] = None
    targetValue: float = 100.0
    weightage: float = 1.0

class GoalCreateSchema(BaseModel):
    employeeId: str
    cycleId: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: str = "individual"  # individual, team, department, company
    weightage: float = 1.0
    targetValue: float = 100.0
    unit: str = "percentage"
    startDate: datetime
    endDate: datetime
    keyResults: Optional[List[KeyResultSchema]] = None

class GoalProgressUpdateSchema(BaseModel):
    currentValue: float

class PerformanceReviewSubmitSchema(BaseModel):
    cycleId: str
    selfRating: Optional[float] = None
    selfComments: Optional[str] = None
    managerRating: Optional[float] = None
    managerComments: Optional[str] = None

class Feedback360SubmitSchema(BaseModel):
    employeeId: str
    cycleId: str
    reviewerId: str
    relationship: str  # peer, direct_report, manager, stakeholder
    rating: float
    comments: str

class PIPRecordCreateSchema(BaseModel):
    employeeId: str
    startDate: datetime
    endDate: datetime
    expectedOutcomes: str

class PIPCoachingNoteSchema(BaseModel):
    note: str

class PromotionNominationSchema(BaseModel):
    employeeId: str
    targetDesignation: str
    proposedCtc: float
    justification: str

class RecognitionAwardSchema(BaseModel):
    employeeId: str
    awardType: str  # spot_award, employee_of_the_month, team_award, innovation_award, customer_appreciation
    citation: str

class CalibrationUpdateSchema(BaseModel):
    reviewId: str
    calibratedRating: float
    calibrationComments: str

class SuccessionPlanCreateSchema(BaseModel):
    positionName: str
    incumbentId: Optional[str] = None
    successorId: str
    readiness: str  # ready_now, ready_1_2_years, ready_3_5_years
    performanceRating: Optional[float] = None
    potentialRating: Optional[float] = None
    developmentNeeds: Optional[str] = None
