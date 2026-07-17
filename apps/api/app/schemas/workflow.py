from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID

class WorkflowAutomationCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    triggerType: str
    triggerConfig: Optional[Dict[str, Any]] = {}
    nodes: Optional[List[Dict[str, Any]]] = []
    connections: Optional[List[Dict[str, Any]]] = []
    isActive: Optional[bool] = True

class WorkflowAutomationUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    triggerType: Optional[str] = None
    triggerConfig: Optional[Dict[str, Any]] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    connections: Optional[List[Dict[str, Any]]] = None
    isActive: Optional[bool] = None

class WorkflowExecutionCreateSchema(BaseModel):
    variables: Optional[Dict[str, Any]] = {}
