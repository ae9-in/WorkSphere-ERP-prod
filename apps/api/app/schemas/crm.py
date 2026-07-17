from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import uuid

class LeadCreate(BaseModel):
    company: str
    contactPerson: str
    phone: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    industry: Optional[str] = None
    companySize: Optional[str] = None
    leadSource: Optional[str] = "Direct"
    priority: Optional[str] = "medium"
    estimatedValue: Optional[float] = 0.0
    expectedClose: Optional[str] = None  # YYYY-MM-DD
    stage: Optional[str] = "new"
    probability: Optional[float] = 10.0
    leadOwner: Optional[str] = None

class LeadStageUpdate(BaseModel):
    stage: str
    probability: float

class CustomerCreate(BaseModel):
    companyName: str
    gst: Optional[str] = None
    pan: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    industry: Optional[str] = None
    employees: Optional[int] = 0
    revenue: Optional[float] = 0.0

class ContactCreate(BaseModel):
    fullName: str
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    isPrimary: Optional[bool] = False

class QuotationItemCreate(BaseModel):
    productName: str
    quantity: int = 1
    unitPrice: float
    taxRate: float = 0.0

class QuotationCreate(BaseModel):
    customerId: str
    issueDate: str  # YYYY-MM-DD
    validUntil: str  # YYYY-MM-DD
    discount: Optional[float] = 0.0
    items: List[QuotationItemCreate]

class SalesOrderCreate(BaseModel):
    customerId: str
    quotationId: Optional[str] = None
    orderDate: str  # YYYY-MM-DD
    shippingAddress: Optional[str] = None
    items: List[QuotationItemCreate]

class CRMTaskCreate(BaseModel):
    leadId: Optional[str] = None
    customerId: Optional[str] = None
    taskType: str  # call, meeting, email, task
    dueDate: str  # YYYY-MM-DD
    priority: Optional[str] = "medium"
    notes: Optional[str] = None
    assignedTo: Optional[str] = None
