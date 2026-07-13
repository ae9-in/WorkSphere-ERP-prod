from pydantic import BaseModel
from typing import Optional, List

class AssetCreateSchema(BaseModel):
    category: str
    name: str
    assetTag: str
    serialNumber: str
    brand: str
    modelName: str
    purchaseDate: Optional[str] = None
    purchasePrice: Optional[float] = None
    warrantyExpiry: Optional[str] = None
    status: Optional[str] = "available"
    condition: Optional[str] = "new"
    notes: Optional[str] = None

class AssetAssignSchema(BaseModel):
    employeeId: str
    condition: str
    remarks: Optional[str] = None

class AssetReturnSchema(BaseModel):
    condition: str
    remarks: Optional[str] = None
