from pydantic import BaseModel
from typing import List, Optional

class DepartmentSchema(BaseModel):
    id: Optional[str] = None
    name: str
    code: str

    class Config:
        from_attributes = True

class DesignationSchema(BaseModel):
    id: Optional[str] = None
    name: str
    code: str

    class Config:
        from_attributes = True

class EmploymentTypeSchema(BaseModel):
    id: Optional[str] = None
    name: str
    code: str

    class Config:
        from_attributes = True

class BranchSchema(BaseModel):
    id: Optional[str] = None
    name: str
    code: str
    lat: float = 0.0
    lng: float = 0.0
    geofence_radius: float = 200.0

    class Config:
        from_attributes = True

class CompanySettingsSchema(BaseModel):
    basic_percent: float = 40.0
    hra_percent: float = 50.0
    pf_enabled: bool = True
    esi_enabled: bool = True
    gps_enabled: bool = False

    class Config:
        from_attributes = True

class CompanySchema(BaseModel):
    name: str
    slug: str
    status: str
    industry: Optional[str] = None
    size: Optional[str] = None
    country: Optional[str] = None

    class Config:
        from_attributes = True

class SettingsResponseData(BaseModel):
    company: Optional[CompanySchema] = None
    settings: CompanySettingsSchema
    departments: List[DepartmentSchema]
    designations: List[DesignationSchema]
    employmentTypes: List[EmploymentTypeSchema]
    branches: List[BranchSchema]

class SettingsResponse(BaseModel):
    success: bool
    data: SettingsResponseData

class HolidaySchema(BaseModel):
    date: str
    name: str
    type: str # national, optional, restricted

class HolidayCalendarSchema(BaseModel):
    id: Optional[str] = None
    name: str
    year: int
    holidays: List[HolidaySchema]

    class Config:
        from_attributes = True

class HolidayCalendarListResponse(BaseModel):
    success: bool
    data: List[HolidayCalendarSchema]

class HolidayCalendarResponse(BaseModel):
    success: bool
    data: HolidayCalendarSchema
