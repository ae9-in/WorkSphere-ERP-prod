from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.models.lms import Course, Lesson, CourseEnrollment
from app.models.employee import Employee
from app.schemas.lms import (
    CourseCreateSchema, CourseEnrollSchema, CourseProgressUpdateSchema
)

def serialize_course(course: Course) -> dict:
    return {
        "_id": str(course.id),
        "title": course.title,
        "description": course.description,
        "category": course.category,
        "difficulty": course.difficulty,
        "durationHours": course.duration_hours
    }

def serialize_enrollment(enroll: CourseEnrollment) -> dict:
    return {
        "_id": str(enroll.id),
        "courseId": str(enroll.course_id),
        "employeeId": str(enroll.employee_id),
        "status": enroll.status,
        "progressPercent": enroll.progress_percent,
        "completedAt": enroll.completed_at.isoformat() if enroll.completed_at else None
    }

class LMSService:
    @staticmethod
    def create_course(db: Session, payload: CourseCreateSchema, tenant_id: uuid.UUID) -> dict:
        course = Course(
            tenant_id=tenant_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            difficulty=payload.difficulty,
            duration_hours=payload.durationHours
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return serialize_course(course)

    @staticmethod
    def list_courses(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        courses = db.query(Course).filter(Course.tenant_id == tenant_id).all()
        return [serialize_course(c) for c in courses]

    @staticmethod
    def enroll_employee(db: Session, payload: CourseEnrollSchema, tenant_id: uuid.UUID) -> dict:
        course_uuid = uuid.UUID(payload.courseId)
        emp_uuid = uuid.UUID(payload.employeeId)

        course = db.query(Course).filter(Course.id == course_uuid, Course.tenant_id == tenant_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        enroll = CourseEnrollment(
            tenant_id=tenant_id,
            course_id=course_uuid,
            employee_id=emp_uuid,
            status="enrolled",
            progress_percent=0.0
        )
        db.add(enroll)
        db.commit()
        db.refresh(enroll)
        return serialize_enrollment(enroll)

    @staticmethod
    def update_progress(db: Session, enrollment_id: str, payload: CourseProgressUpdateSchema, tenant_id: uuid.UUID) -> dict:
        enroll_uuid = uuid.UUID(enrollment_id)
        enroll = db.query(CourseEnrollment).filter(
            CourseEnrollment.id == enroll_uuid,
            CourseEnrollment.tenant_id == tenant_id
        ).first()
        if not enroll:
            raise HTTPException(status_code=404, detail="Course enrollment not found")

        enroll.progress_percent = payload.progressPercent
        if enroll.progress_percent >= 100.0:
            enroll.status = "completed"
            enroll.completed_at = datetime.utcnow()
        else:
            enroll.status = "in_progress"

        db.commit()
        db.refresh(enroll)
        return serialize_enrollment(enroll)

    @staticmethod
    def get_enrollments_by_employee(db: Session, employee_id: str, tenant_id: uuid.UUID) -> List[dict]:
        emp_uuid = uuid.UUID(employee_id)
        enrollments = db.query(CourseEnrollment).filter(
            CourseEnrollment.employee_id == emp_uuid,
            CourseEnrollment.tenant_id == tenant_id
        ).all()
        return [serialize_enrollment(e) for e in enrollments]
