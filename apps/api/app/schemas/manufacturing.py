from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid

# ── General Config ──
class BaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

# ── Plants & Calendars ──
class PlantCreateSchema(BaseSchema):
    code: str
    name: str
    address: Optional[str] = None
    managerId: Optional[str] = None
    status: Optional[str] = "active"

class CalendarCreateSchema(BaseSchema):
    plantId: str
    name: str
    workingDays: Optional[str] = "Monday,Tuesday,Wednesday,Thursday,Friday"
    shifts: Optional[str] = "Morning,Evening"
    holidays: Optional[str] = ""
    status: Optional[str] = "active"

# ── BOM & Components ──
class BOMComponentSchema(BaseSchema):
    itemCode: str
    quantity: float
    uom: Optional[str] = "piece"

class BOMCreateSchema(BaseSchema):
    bomNumber: str
    productItemCode: str
    version: Optional[str] = "1.0.0"
    components: List[BOMComponentSchema]

# ── Work Centers & Machines ──
class WorkCenterCreateSchema(BaseSchema):
    code: str
    name: str
    department: Optional[str] = None
    capacity: Optional[float] = 100.0
    shiftSchedule: Optional[str] = "Morning,Evening"

class MachineCreateSchema(BaseSchema):
    machineCode: str
    name: str
    equipmentType: Optional[str] = None
    manufacturer: Optional[str] = None
    installationDate: Optional[str] = None # format YYYY-MM-DD
    maintenanceSchedule: Optional[str] = None
    calibrationStatus: Optional[str] = "calibrated"
    status: Optional[str] = "active"

# ── Routings & Operations ──
class RoutingOperationSchema(BaseSchema):
    sequence: int
    workCenterCode: str
    machineCode: Optional[str] = None
    standardTime: Optional[float] = 1.0 # hours
    setupTime: Optional[float] = 0.1 # hours
    laborTime: Optional[float] = 1.0 # hours
    isInspectionPoint: Optional[bool] = False
    outputQuantity: Optional[float] = 1.0

class RoutingCreateSchema(BaseSchema):
    code: str
    name: str
    productItemCode: str
    version: Optional[str] = "1.0.0"
    operations: List[RoutingOperationSchema]

# ── Production & Work Orders ──
class ProductionOrderCreateSchema(BaseSchema):
    orderNumber: str
    itemCode: str
    bomNumber: str
    routingCode: str
    quantity: float
    plannedStart: Optional[str] = None # YYYY-MM-DD HH:MM:SS
    plannedFinish: Optional[str] = None # YYYY-MM-DD HH:MM:SS
    plantCode: str

class WorkOrderReleaseSchema(BaseSchema):
    productionOrderId: str
    workCenterCode: str
    machineCode: Optional[str] = None
    operatorId: Optional[str] = None
    plannedQuantity: float

# ── Shop Floor Transactions ──
class MaterialConsumptionSchema(BaseSchema):
    itemCode: str
    warehouseCode: Optional[str] = None
    locationCode: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    quantityConsumed: float
    wasteQuantity: Optional[float] = 0.0

class WorkOrderCompleteSchema(BaseSchema):
    producedQuantity: float
    scrapQuantity: Optional[float] = 0.0
    rejectedQuantity: Optional[float] = 0.0
    locationCode: Optional[str] = None # Finished Goods target location bin
    consumptions: List[MaterialConsumptionSchema]
    remarks: Optional[str] = None

# ── Quality Inspections ──
class QualityInspectionSubmitSchema(BaseSchema):
    workOrderNumber: Optional[str] = None
    itemCode: str
    stage: str # incoming, in_process, final, batch
    result: str # pass, conditional_pass, rework, reject
    criteria: Optional[str] = None # JSON string
    remarks: Optional[str] = None

class CAPASaveSchema(BaseSchema):
    defectDetails: str
    rootCause: Optional[str] = None
    correctiveAction: Optional[str] = None
    status: Optional[str] = "open"

# ── Scrap ──
class ScrapSubmitSchema(BaseSchema):
    workOrderNumber: Optional[str] = None
    itemCode: str
    scrapCategory: str
    quantity: float
    cost: Optional[float] = 0.0
    reason: Optional[str] = None

# ── AI Predictions ──
class ManufacturingPredictionRequest(BaseSchema):
    plantCode: str
    machineCode: Optional[str] = None
    horizonDays: Optional[int] = 30
