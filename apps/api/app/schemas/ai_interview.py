from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIInterviewSessionCreateSchema(BaseModel):
    candidateId: str
    jobPostingId: str

class AIInterviewResponseSubmitSchema(BaseModel):
    questionId: str
    responseText: str
    durationTaken: int

class AIInterviewSessionUpdateSchema(BaseModel):
    overallScore: float
    summary: str
    status: str
