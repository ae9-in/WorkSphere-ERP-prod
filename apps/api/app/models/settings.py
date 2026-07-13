from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Integer, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel, BaseModel

class Department(TenantBaseModel):
    __tablename__ = "departments"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_dept_code"),
    )


class Designation(TenantBaseModel):
    __tablename__ = "designations"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_desig_code"),
    )


class EmploymentType(TenantBaseModel):
    __tablename__ = "employment_types"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_emptype_code"),
    )


class Branch(TenantBaseModel):
    __tablename__ = "branches"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    lat = Column(Float, default=0.0, nullable=False)
    lng = Column(Float, default=0.0, nullable=False)
    geofence_radius = Column(Float, default=200.0, nullable=False) # in meters

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_branch_code"),
    )


class CompanySettings(TenantBaseModel):
    __tablename__ = "company_settings"

    basic_percent = Column(Float, default=40.0, nullable=False)
    hra_percent = Column(Float, default=50.0, nullable=False)
    pf_enabled = Column(Boolean, default=True, nullable=False)
    esi_enabled = Column(Boolean, default=True, nullable=False)
    gps_enabled = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", name="uq_tenant_settings"),
    )


class HolidayCalendar(TenantBaseModel):
    __tablename__ = "holiday_calendars"

    name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)

    holidays = relationship("Holiday", back_populates="calendar", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "year", name="uq_tenant_holiday_year"),
    )


class Holiday(BaseModel):
    __tablename__ = "holidays"

    calendar_id = Column(UUID(as_uuid=True), ForeignKey("holiday_calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, default="national", nullable=False) # national, optional, restricted

    calendar = relationship("HolidayCalendar", back_populates="holidays")
