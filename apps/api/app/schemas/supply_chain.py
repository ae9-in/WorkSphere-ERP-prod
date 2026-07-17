from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class SCMBaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class NetworkNodeCreateSchema(SCMBaseSchema):
    nodeCode: str
    name: str
    nodeType: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DistributionCenterCreateSchema(SCMBaseSchema):
    centerCode: str
    name: str
    address: Optional[str] = None
    capacity: Optional[float] = None
    managerName: Optional[str] = None
    operatingHours: Optional[str] = None

class PartnerCreateSchema(SCMBaseSchema):
    partnerCode: str
    companyName: str
    contactDetails: Optional[str] = None
    serviceAreas: Optional[str] = None
    supportedVehicles: Optional[str] = None
    slaTerms: Optional[str] = None
    insuranceInfo: Optional[str] = None
    performanceRating: Optional[float] = 5.0

class CarrierCreateSchema(SCMBaseSchema):
    carrierCode: str
    name: str
    carrierType: str
    contractVersion: Optional[str] = None
    status: Optional[str] = "active"

class VehicleCreateSchema(SCMBaseSchema):
    vehicleNumber: str
    vehicleType: str
    capacityWeight: float
    capacityVolume: float
    fuelType: Optional[str] = None
    gpsDeviceId: Optional[str] = None
    driverId: Optional[str] = None
    status: Optional[str] = "available"
    maintenanceStatus: Optional[str] = "good"

class DriverCreateSchema(SCMBaseSchema):
    driverNumber: str
    name: str
    licenseNumber: str
    licenseExpiry: Optional[str] = None  # Format: YYYY-MM-DD
    certifications: Optional[str] = None
    contactPhone: Optional[str] = None
    assignedVehicleId: Optional[str] = None
    availabilityStatus: Optional[str] = "active"
    performanceRating: Optional[float] = 5.0

class ShipmentItemSchema(SCMBaseSchema):
    itemCode: str
    quantity: float
    weight: Optional[float] = 0.0
    volume: Optional[float] = 0.0

class ShipmentCreateSchema(SCMBaseSchema):
    customerName: str
    warehouseCode: str
    destinationAddress: str
    carrierId: Optional[str] = None
    vehicleId: Optional[str] = None
    driverId: Optional[str] = None
    priority: Optional[str] = "medium"
    deliveryWindowStart: Optional[str] = None  # Format: YYYY-MM-DD HH:MM:SS
    deliveryWindowEnd: Optional[str] = None    # Format: YYYY-MM-DD HH:MM:SS
    items: List[ShipmentItemSchema]

class DispatchConfirmSchema(SCMBaseSchema):
    shipmentId: str
    vehicleId: str
    driverId: str
    departureTime: Optional[str] = None       # Format: YYYY-MM-DD HH:MM:SS
    expectedArrival: Optional[str] = None     # Format: YYYY-MM-DD HH:MM:SS
    gatePassNumber: Optional[str] = None

class RouteCreateSchema(SCMBaseSchema):
    shipmentId: str
    legsSequence: str  # JSON list string of destinations/coordinates
    totalDistance: float
    estimatedDuration: float
    optimized: Optional[bool] = True

class TelemetryUpdateSchema(SCMBaseSchema):
    vehicleId: str
    shipmentId: str
    latitude: float
    longitude: float
    speed: Optional[float] = 0.0
    status: Optional[str] = "in_transit"

class PodSubmitSchema(SCMBaseSchema):
    shipmentId: str
    signatureData: Optional[str] = None
    customerSignerName: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photoPath: Optional[str] = None
    otpCode: Optional[str] = None
    remarks: Optional[str] = None

class ReturnLogSchema(SCMBaseSchema):
    originalShipmentId: Optional[str] = None
    itemCode: str
    quantity: float
    returnReason: Optional[str] = None
    inspectionRemarks: Optional[str] = None

class CarrierRateCreateSchema(SCMBaseSchema):
    carrierId: str
    originZone: str
    destinationZone: str
    ratePerKm: float
    ratePerKg: float
    baseCharge: float
    status: Optional[str] = "active"

class ContainerLoadingPlanCreateSchema(SCMBaseSchema):
    shipmentId: str
    vehicleId: str

class SCMDelayAlertCreateSchema(SCMBaseSchema):
    shipmentId: str
    delayType: str
    durationMinutes: int
    severity: Optional[str] = "medium"
    remarks: Optional[str] = None

class SCMDelayAlertResolveSchema(SCMBaseSchema):
    resolved: bool
    remarks: Optional[str] = None
