from pydantic import BaseModel
from typing import Optional, List

class LeaveTypeCreateSchema(BaseModel):
    name: str
    code: str
    is_paid: bool = True
    accrual_based: bool = False
    max_days: int = 12
    carry_forward: bool = False
    requires_approval: bool = True
    gender: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveApplyRequest(BaseModel):
    employeeId: Optional[str] = None
    leaveTypeId: str
    from_date: str # YYYY-MM-DD
    to_date: str # YYYY-MM-DD
    reason: str
    halfDay: bool = False
    halfDayType: Optional[str] = None # first_half, second_half

    class Config:
        from_attributes = True


class LeaveActionRequest(BaseModel):
    comments: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveLedgerSchema(BaseModel):
    id: Optional[str] = None
    employeeId: str
    leaveTypeId: str
    transactionType: str
    days: float
    previousBalance: float
    newBalance: float
    description: Optional[str] = None
    transactionDate: str

    class Config:
        from_attributes = True


class LeaveEncashmentSchema(BaseModel):
    id: Optional[str] = None
    employeeId: str
    leaveTypeId: str
    days: float
    amount: float
    status: str
    reason: Optional[str] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveCarryForwardSchema(BaseModel):
    id: Optional[str] = None
    employeeId: str
    leaveTypeId: str
    sourceYear: int
    targetYear: int
    daysCarried: float
    daysExpired: float
    processedAt: str

    class Config:
        from_attributes = True


class LeaveTimelineSchema(BaseModel):
    id: Optional[str] = None
    eventType: str
    timestamp: str
    performedBy: Optional[str] = None
    metadataJson: Optional[dict] = None

    class Config:
        from_attributes = True


class LeaveCancelRequest(BaseModel):
    comments: Optional[str] = None


class LeaveWithdrawRequest(BaseModel):
    comments: Optional[str] = None


class LeaveAccrualRequest(BaseModel):
    employeeId: Optional[str] = None
    leaveTypeId: Optional[str] = None


class LeaveEncashRequest(BaseModel):
    employeeId: Optional[str] = None
    leaveTypeId: str
    days: float
    reason: Optional[str] = None
