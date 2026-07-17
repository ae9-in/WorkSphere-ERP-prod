from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

# Category Schemas
class CategoryCreateSchema(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    isActive: Optional[bool] = True

# Item Schemas
class InventoryItemCreateSchema(BaseModel):
    name: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    categoryCode: Optional[str] = None
    uom: Optional[str] = "piece"
    taxCategory: Optional[str] = None
    barcode: Optional[str] = None
    qrCode: Optional[str] = None
    minStock: Optional[float] = 0.0
    maxStock: Optional[float] = 0.0
    safetyStock: Optional[float] = 0.0
    reorderPoint: Optional[float] = 0.0
    preferredVendor: Optional[str] = None
    defaultWarehouseCode: Optional[str] = None

# Warehouse Schemas
class WarehouseCreateSchema(BaseModel):
    code: str
    name: str
    address: Optional[str] = None
    managerId: Optional[str] = None
    capacity: Optional[float] = None
    type: Optional[str] = "distribution"
    status: Optional[str] = "active"
    currency: Optional[str] = "INR"

# Location Schemas
class LocationCreateSchema(BaseModel):
    warehouseCode: str
    code: str
    zone: Optional[str] = None
    aisle: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None

# Stock In Schema
class StockInSchema(BaseModel):
    itemCode: str
    warehouseCode: str
    locationCode: Optional[str] = None
    quantity: float
    unitCost: float
    referenceType: Optional[str] = None
    referenceId: Optional[str] = None
    batchNumber: Optional[str] = None
    expiryDate: Optional[str] = None # YYYY-MM-DD
    serialNumbers: Optional[List[str]] = None
    remarks: Optional[str] = None

# Stock Out Schema
class StockOutSchema(BaseModel):
    itemCode: str
    warehouseCode: str
    locationCode: Optional[str] = None
    quantity: float
    referenceType: Optional[str] = None
    referenceId: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumbers: Optional[List[str]] = None
    remarks: Optional[str] = None

# Stock Transfer Schema
class StockTransferSchema(BaseModel):
    itemCode: str
    fromWarehouseCode: str
    fromLocationCode: Optional[str] = None
    toWarehouseCode: str
    toLocationCode: Optional[str] = None
    quantity: float
    batchNumber: Optional[str] = None
    serialNumbers: Optional[List[str]] = None
    remarks: Optional[str] = None

# Adjustment Schemas
class AdjustmentCreateSchema(BaseModel):
    itemCode: str
    warehouseCode: str
    locationCode: Optional[str] = None
    quantityAdjusted: float
    unitCost: Optional[float] = 0.0
    type: str # in, out
    reason: str

class AdjustmentApproveSchema(BaseModel):
    status: str # approved, rejected

# Cycle Count Schemas
class CountItemSchema(BaseModel):
    itemCode: str
    locationCode: Optional[str] = None
    countedQuantity: float
    remarks: Optional[str] = None

class CycleCountSubmitSchema(BaseModel):
    warehouseCode: str
    countDate: Optional[str] = None
    items: List[CountItemSchema]

# AI Prediction Request Schema
class PredictionRequestSchema(BaseModel):
    itemCode: str
    horizonDays: Optional[int] = 30

# New Upgraded Inventory Schemas
class InventoryItemUpdateSchema(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    minStock: Optional[float] = None
    maxStock: Optional[float] = None
    safetyStock: Optional[float] = None
    reorderPoint: Optional[float] = None
    preferredVendor: Optional[str] = None
    defaultWarehouseCode: Optional[str] = None
    status: Optional[str] = None

class ReservationCreateSchema(BaseModel):
    itemCode: str
    warehouseCode: str
    locationCode: Optional[str] = None
    quantity: float
    referenceType: str
    referenceId: str
    expiryDate: Optional[str] = None

class QualityInspectionCreateSchema(BaseModel):
    batchNumber: str
    itemCode: str
    sampleSize: float
    failedQuantity: float
    checklist: dict
    status: str
    remarks: Optional[str] = None

class LandedCostItemSchema(BaseModel):
    itemCode: str
    purchaseReceiptId: str
    receiptQuantity: float
    allocatedExpense: float

class LandedCostVoucherSchema(BaseModel):
    voucherNumber: str
    distributeBy: str
    totalExpenses: float
    items: List[LandedCostItemSchema]

class AssetAssignmentSchema(BaseModel):
    itemCode: str
    serialNumber: str
    employeeId: str
    conditionOnAssign: Optional[str] = "good"

class AssetReturnSchema(BaseModel):
    itemCode: str
    serialNumber: str
    conditionOnReturn: str
    status: Optional[str] = "returned"

class ImportItemRowSchema(BaseModel):
    name: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    categoryCode: Optional[str] = None
    uom: Optional[str] = "piece"
    minStock: Optional[float] = 0.0
    maxStock: Optional[float] = 0.0
    reorderPoint: Optional[float] = 0.0
    preferredVendor: Optional[str] = None
    defaultWarehouseCode: Optional[str] = None

class ImportCSVSchema(BaseModel):
    items: List[ImportItemRowSchema]

class SupplierCreateSchema(BaseModel):
    companyName: str
    supplierCode: str
    gst: Optional[str] = None
    pan: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    paymentTerms: Optional[str] = None
    leadTimeDays: Optional[int] = 7

class PurchaseOrderItemCreateSchema(BaseModel):
    itemId: str
    quantity: float
    unitPrice: float

class PurchaseOrderCreateSchema(BaseModel):
    supplierId: str
    orderDate: str  # YYYY-MM-DD
    expectedDelivery: Optional[str] = None  # YYYY-MM-DD
    shippingAddress: Optional[str] = None
    items: List[PurchaseOrderItemCreateSchema]

class GoodsReceiptCreateSchema(BaseModel):
    purchaseOrderId: str
    receiptDate: str  # YYYY-MM-DD
    remarks: Optional[str] = None
