from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid

class BaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

# ── Asset Registry & Equipment ──
class AssetCreateSchema(BaseSchema):
    assetCode: str
    name: str
    category: str # CNC, Assembly, HVAC, Electrical, etc.
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serialNumber: Optional[str] = None
    purchaseDate: Optional[str] = None # YYYY-MM-DD
    installationDate: Optional[str] = None # YYYY-MM-DD
    warrantyExpiry: Optional[str] = None # YYYY-MM-DD
    plantId: Optional[str] = None # Plant UUID
    department: Optional[str] = None
    status: Optional[str] = "active"

class EquipmentCreateSchema(BaseSchema):
    code: str
    name: str
    description: Optional[str] = None

class HierarchyCreateSchema(BaseSchema):
    parentAssetId: Optional[str] = None
    childAssetId: str
    relationType: Optional[str] = "component" # area, line, machine, component

# ── PM Plans & Calendars ──
class PlanCreateSchema(BaseSchema):
    planNumber: str
    assetId: str
    maintenanceType: Optional[str] = "preventive"
    frequency: Optional[str] = "monthly"
    checklist: Optional[str] = None # JSON string
    estimatedDuration: Optional[float] = 1.0 # hours
    safetyInstructions: Optional[str] = None

class CalendarCreateSchema(BaseSchema):
    planId: str
    assetId: str
    scheduledDate: str # YYYY-MM-DD
    status: Optional[str] = "scheduled"

# ── Maintenance Work Requests ──
class RequestSubmitSchema(BaseSchema):
    assetId: str
    problemDescription: str
    priority: Optional[str] = "medium" # low, medium, high, critical
    department: Optional[str] = None

# ── Work Orders & Technician Scheduling ──
class WorkOrderCreateSchema(BaseSchema):
    assetId: str
    requestId: Optional[str] = None
    planId: Optional[str] = None
    maintenanceType: Optional[str] = "corrective" # preventive, corrective, emergency, inspection
    assignedTechnicianId: Optional[str] = None
    plannedStart: Optional[str] = None # YYYY-MM-DD HH:MM:SS
    plannedFinish: Optional[str] = None # YYYY-MM-DD HH:MM:SS
    estimatedLaborHours: Optional[float] = 1.0
    safetyChecklist: Optional[str] = None

class TechnicianCreateSchema(BaseSchema):
    technicianId: str
    email: str
    skillName: str
    certificationDetails: Optional[str] = None
    shiftSchedule: Optional[str] = None

# ── Inspections Checklists ──
class InspectionSubmitSchema(BaseSchema):
    workOrderId: Optional[str] = None
    assetId: str
    stage: str # visual, electrical, calibration
    result: str # pass, fail
    criteria: Optional[str] = None # JSON string
    remarks: Optional[str] = None

class ChecklistTemplateCreateSchema(BaseSchema):
    name: str
    version: Optional[str] = "1.0.0"
    checklistData: str # JSON template string

# ── Consumptions & Costing ──
class SpareConsumptionSubmitSchema(BaseSchema):
    workOrderId: str
    itemCode: str
    quantityConsumed: float
    warehouseCode: str
    locationCode: Optional[str] = None

# ── AI Predictions Telemetry ──
class TelemetrySubmitSchema(BaseSchema):
    assetId: str
    healthScore: Optional[float] = 100.0
    operatingHours: Optional[float] = 0.0
    runtimeHours: Optional[float] = 0.0
    downtimeHours: Optional[float] = 0.0
    temperature: Optional[float] = 25.0
    vibration: Optional[float] = 0.15
    powerConsumption: Optional[float] = 1.2
