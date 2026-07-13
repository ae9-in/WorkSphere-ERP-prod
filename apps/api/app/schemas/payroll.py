from pydantic import BaseModel
from typing import Optional, List

class ComponentSchema(BaseModel):
    code: str
    name: str
    type: str # earning, deduction, employer
    calc_type: str # pct_ctc, pct_basic, formula, fixed
    value: float
    is_taxable: bool = True
    is_statutory: bool = False
    display_order: int = 1

    class Config:
        from_attributes = True


class SalaryStructureCreateSchema(BaseModel):
    name: str
    components: List[ComponentSchema]

    class Config:
        from_attributes = True


class PayrollRunCreateSchema(BaseModel):
    month: int
    year: int

    class Config:
        from_attributes = True


class PayrollCalendarCreateSchema(BaseModel):
    name: str
    frequency: str # monthly, weekly, bi_weekly, semi_monthly, daily
    start_date: str # YYYY-MM-DD
    end_date: str # YYYY-MM-DD
    processing_date: int
    disbursement_date: int

    class Config:
        from_attributes = True


class PayGroupCreateSchema(BaseModel):
    name: str
    calendar_id: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeSalaryAssignSchema(BaseModel):
    employeeId: str
    structureId: Optional[str] = None
    payGroupId: Optional[str] = None
    ctc: float
    effectiveDate: str # YYYY-MM-DD

    class Config:
        from_attributes = True


class PayrollAdjustmentCreateSchema(BaseModel):
    employeeId: str
    type: str # earning, deduction
    amount: float
    reason: str

    class Config:
        from_attributes = True


class PayrollLoanCreateSchema(BaseModel):
    employeeId: str
    principalAmount: float
    interestRate: float = 0.0
    emiAmount: float
    installments: int
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class PayrollReimbursementCreateSchema(BaseModel):
    employeeId: Optional[str] = None
    category: str # travel, food, medical, mobile, client_expense, other
    amount: float
    reason: str
    receiptUrl: Optional[str] = None

    class Config:
        from_attributes = True
