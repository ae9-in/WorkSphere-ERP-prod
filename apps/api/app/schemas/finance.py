from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import uuid

class AccountCreate(BaseModel):
    code: str
    name: str
    type: str  # asset, liability, equity, income, expense
    parent_id: Optional[str] = None
    description: Optional[str] = None

class AccountSchema(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    type: str
    parent_id: Optional[uuid.UUID] = None
    status: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class JournalItemCreate(BaseModel):
    accountId: str
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None
    partnerType: Optional[str] = None
    partnerId: Optional[str] = None

class JournalEntryCreate(BaseModel):
    date: str  # YYYY-MM-DD
    narration: Optional[str] = None
    reference: Optional[str] = None
    branch: str = "HQ"
    costCenter: Optional[str] = None
    items: List[JournalItemCreate]

class JournalItemSchema(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    debit: float
    credit: float
    description: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True

class JournalEntrySchema(BaseModel):
    id: uuid.UUID
    entry_number: str
    date: date
    status: str
    narration: Optional[str] = None
    reference: Optional[str] = None
    branch: str
    cost_center: Optional[str] = None
    items: List[JournalItemSchema] = []

    class Config:
        from_attributes = True

class ExpenseLineCreate(BaseModel):
    category: str
    date: str  # YYYY-MM-DD
    description: Optional[str] = None
    amount: float
    taxAmount: float = 0.0
    merchant: Optional[str] = None
    receiptUrl: Optional[str] = None

class ExpenseClaimCreate(BaseModel):
    date: str  # YYYY-MM-DD
    notes: Optional[str] = None
    lines: List[ExpenseLineCreate]

class ExpenseClaimSchema(BaseModel):
    id: uuid.UUID
    claim_number: str
    employee_id: Optional[uuid.UUID] = None
    employee_name: Optional[str] = None
    date: date
    status: str
    total_amount: float
    currency: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceItemCreate(BaseModel):
    productName: str
    quantity: int = 1
    unitPrice: float
    discount: float = 0.0
    hsnCode: Optional[str] = None
    taxRate: float = 0.0

class InvoiceCreate(BaseModel):
    customerName: str
    customerEmail: Optional[str] = None
    issueDate: str  # YYYY-MM-DD
    dueDate: str  # YYYY-MM-DD
    discount: float = 0.0
    taxRate: float = 0.0
    items: List[InvoiceItemCreate]

class InvoicePaymentCreate(BaseModel):
    paymentDate: str  # YYYY-MM-DD
    amount: float
    paymentMethod: str  # stripe, razorpay, cash, cheque, bank_transfer
    referenceNo: Optional[str] = None
    notes: Optional[str] = None

class InvoiceSchema(BaseModel):
    id: uuid.UUID
    invoice_number: str
    customer_name: str
    customer_email: Optional[str] = None
    issue_date: date
    due_date: date
    status: str
    discount: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    balance_due: float
    createdAt: Optional[str] = None

    class Config:
        from_attributes = True

class BudgetCreate(BaseModel):
    departmentName: str
    fiscalYear: int
    quarter: Optional[str] = None
    allocatedAmount: float

class BudgetSchema(BaseModel):
    id: uuid.UUID
    department_name: str
    fiscal_year: int
    quarter: Optional[str] = None
    allocated_amount: float
    spent_amount: float
    status: str

    class Config:
        from_attributes = True

class TaxFilingCreate(BaseModel):
    taxType: str
    filingPeriod: str
    dueDate: str  # YYYY-MM-DD
    amountDue: float
    returnForm: Optional[str] = None

class TaxFilingSchema(BaseModel):
    id: uuid.UUID
    tax_type: str
    filing_period: str
    due_date: date
    status: str
    amount_due: float
    amount_paid: float
    payment_date: Optional[date] = None
    reference_no: Optional[str] = None
    return_form: Optional[str] = None

    class Config:
        from_attributes = True
