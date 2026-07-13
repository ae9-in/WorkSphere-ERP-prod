from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class AnnouncementCreateSchema(BaseModel):
    title: str
    content: str
    isPinned: bool = False

class FeedPostCreateSchema(BaseModel):
    content: str

class PollCreateSchema(BaseModel):
    question: str
    optionsJson: List[str]

class PollVoteSchema(BaseModel):
    selectedOption: str
