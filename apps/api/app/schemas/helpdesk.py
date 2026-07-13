from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class TicketCreateSchema(BaseModel):
    title: str
    description: str
    category: str = "general" # hr, it, payroll, facilities, general
    priority: str = "medium" # low, medium, high

class TicketAssignSchema(BaseModel):
    assignedToId: str

class TicketStatusUpdateSchema(BaseModel):
    status: str

class TicketCommentCreateSchema(BaseModel):
    content: str
