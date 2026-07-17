from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID

class BIDashboardWidgetCreateSchema(BaseModel):
    title: str
    type: str
    sizeX: int
    sizeY: int
    posX: int
    posY: int
    queryConfig: Optional[Dict[str, Any]] = {}

class BIDashboardCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "executive"
    isShared: Optional[bool] = True
    roleRestrictions: Optional[List[str]] = []
    widgets: Optional[List[BIDashboardWidgetCreateSchema]] = []

class BIReportCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "custom"
    config: Dict[str, Any]

class BIScheduledReportCreateSchema(BaseModel):
    reportId: str
    cronExpression: str
    deliveryChannel: Optional[str] = "email"
    deliveryConfig: Optional[Dict[str, Any]] = {}
    isActive: Optional[bool] = True

class BIAlertRuleCreateSchema(BaseModel):
    name: str
    kpiName: str
    conditionOperator: str
    thresholdValue: float
    channel: Optional[str] = "email"
    recipient: str
    isActive: Optional[bool] = True

class BIQueryBuilderSchema(BaseModel):
    table: str
    fields: List[str]
    aggregations: Optional[List[Dict[str, Any]]] = []
    filters: Optional[List[Dict[str, Any]]] = []
    groupBy: Optional[List[str]] = []
    limit: Optional[int] = 50

class BIAIQuerySchema(BaseModel):
    prompt: str

class BIForecastSchema(BaseModel):
    kpiName: str
