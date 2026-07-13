from pydantic import BaseModel
from typing import Optional, List

class ShiftSchema(BaseModel):
    id: Optional[str] = None
    name: str
    code: str
    startTime: str
    endTime: str
    breakDuration: int
    gracePeriod: int
    minWorkingHours: float
    isActive: bool = True

    class Config:
        from_attributes = True


class ShiftAssignmentSchema(BaseModel):
    id: Optional[str] = None
    employeeId: str
    shiftId: str
    effectiveDate: str
    isActive: bool = True

    class Config:
        from_attributes = True


class BreakSchema(BaseModel):
    id: Optional[str] = None
    breakType: str
    startTime: str
    endTime: Optional[str] = None
    durationMinutes: Optional[int] = None

    class Config:
        from_attributes = True


class RegularizationSchema(BaseModel):
    id: Optional[str] = None
    requestType: str
    requestedCheckIn: Optional[str] = None
    requestedCheckOut: Optional[str] = None
    reason: str
    status: Optional[str] = "pending"
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True


class OvertimeRequestSchema(BaseModel):
    id: Optional[str] = None
    otHours: float
    reason: Optional[str] = None
    status: Optional[str] = "pending"
    approvedBy: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceTimelineSchema(BaseModel):
    id: Optional[str] = None
    eventType: str
    timestamp: str
    performedBy: Optional[str] = None
    metadataJson: Optional[dict] = None

    class Config:
        from_attributes = True


class CheckInRequest(BaseModel):
    employeeId: Optional[str] = None
    fullName: Optional[str] = None
    workMode: str = "onsite"
    lat: Optional[float] = None
    lng: Optional[float] = None
    deviceId: Optional[str] = None
    ipAddress: Optional[str] = None


class AttendanceResponseData(BaseModel):
    id: str
    employeeId: str
    fullName: str
    date: str
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    status: str
    workMode: str
    workingHours: float
    otHours: float
    isLocked: bool
    geofenceStatus: str
    notes: Optional[str] = None
    shift: Optional[ShiftSchema] = None
    breaks: Optional[List[BreakSchema]] = None
    regularizations: Optional[List[RegularizationSchema]] = None
    overtimes: Optional[List[OvertimeRequestSchema]] = None
    timelines: Optional[List[AttendanceTimelineSchema]] = None

    class Config:
        from_attributes = True


class AttendanceSummaryResponse(BaseModel):
    today: str
    present: int
    wfh: int
    late: int
    absent: int
    total: int
    attendanceRate: float


class WeeklyTrendDay(BaseModel):
    day: str
    date: str
    present: int
    wfh: int
    absent: int
    late: int
