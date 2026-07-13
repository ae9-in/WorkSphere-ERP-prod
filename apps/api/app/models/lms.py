import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel

class Course(TenantBaseModel):
    __tablename__ = "lms_courses"

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, default="technical", nullable=False) # technical, compliance, leadership, soft_skills
    difficulty = Column(String, default="beginner", nullable=False) # beginner, intermediate, advanced
    duration_hours = Column(Float, default=5.0, nullable=False)

    lessons = orm_relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    enrollments = orm_relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")

class Lesson(TenantBaseModel):
    __tablename__ = "lms_lessons"

    course_id = Column(UUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    order = Column(Integer, default=1, nullable=False)

    course = orm_relationship("Course", back_populates="lessons")

class CourseEnrollment(TenantBaseModel):
    __tablename__ = "lms_enrollments"

    course_id = Column(UUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="enrolled", nullable=False) # enrolled, in_progress, completed, dropped
    progress_percent = Column(Float, default=0.0, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    course = orm_relationship("Course", back_populates="enrollments")
