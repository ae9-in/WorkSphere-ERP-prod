from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class AssessmentTemplateCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "coding" # coding, aptitude, mcq, domain, personality
    durationMinutes: int = 60
    passingScore: float = 70.0
    questionsJson: List[Dict[str, Any]]

class AssessmentAttemptStartSchema(BaseModel):
    templateId: str
    candidateId: str

class AssessmentAttemptSubmitSchema(BaseModel):
    answersJson: Dict[str, Any]
