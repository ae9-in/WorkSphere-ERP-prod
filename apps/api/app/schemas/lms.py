from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class CourseCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "technical" # technical, compliance, leadership, soft_skills
    difficulty: str = "beginner" # beginner, intermediate, advanced
    durationHours: float = 5.0

class CourseEnrollSchema(BaseModel):
    courseId: str
    employeeId: str

class CourseProgressUpdateSchema(BaseModel):
    progressPercent: float
