from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Integer, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import TenantBaseModel, BaseModel

class SalaryStructure(TenantBaseModel):
    __tablename__ = "salary_structures"

    name = Column(String, nullable=False)
    
    # 1-to-many relationship with components
    components = relationship("SalaryStructureComponent", back_populates="structure", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_tenant_salary_name"),
    )


class SalaryStructureComponent(BaseModel):
    __tablename__ = "salary_structure_components"

    structure_id = Column(UUID(as_uuid=True), ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # earning, deduction, employer
    calc_type = Column(String, nullable=False) # fixed, pct_ctc, pct_basic, formula
    value = Column(Float, default=0.0, nullable=False)
    is_taxable = Column(Boolean, default=True, nullable=False)
    is_statutory = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    structure = relationship("SalaryStructure", back_populates="components")


class PayrollRun(TenantBaseModel):
    __tablename__ = "payroll_runs"

    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)
    period = Column(String, nullable=False) # e.g. "June 2026"
    status = Column(String, default="draft", nullable=False) # draft, processing, completed, approved, paid, cancelled
    total_employees = Column(Integer, default=0, nullable=False)
    total_gross = Column(Float, default=0.0, nullable=False)
    total_deductions = Column(Float, default=0.0, nullable=False)
    total_net_pay = Column(Float, default=0.0, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)


class Payslip(TenantBaseModel):
    __tablename__ = "payslips"

    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Store snapshot of employee details for historical payroll audit
    employee_snapshot = Column(JSON, nullable=False)
    
    # Store calculations
    pay_period = Column(JSON, nullable=False) # workingDays, presentDays, lopDays, overtimeHours
    earnings = Column(JSON, nullable=False) # Array of components [{code, name, amount}]
    deductions = Column(JSON, nullable=False) # Array of components [{code, name, amount}]
    totals = Column(JSON, nullable=False) # gross, deductions, net, ctc
    ytd = Column(JSON, nullable=False) # gross, deductions, net
    
    status = Column(String, default="draft", nullable=False) # draft, published
    pdf_url = Column(String, nullable=True)

    employee = relationship("Employee")


class PayrollCalendar(TenantBaseModel):
    __tablename__ = "payroll_calendars"

    name = Column(String, nullable=False)
    frequency = Column(String, default="monthly", nullable=False) # monthly, weekly, bi_weekly, semi_monthly, daily
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    processing_date = Column(Integer, default=25, nullable=False) # Day of month
    disbursement_date = Column(Integer, default=30, nullable=False) # Day of month


class PayGroup(TenantBaseModel):
    __tablename__ = "pay_groups"

    name = Column(String, nullable=False)
    calendar_id = Column(UUID(as_uuid=True), ForeignKey("payroll_calendars.id", ondelete="SET NULL"), nullable=True)
    description = Column(String, nullable=True)

    calendar = relationship("PayrollCalendar")


class EmployeeSalary(TenantBaseModel):
    __tablename__ = "employee_salaries"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    structure_id = Column(UUID(as_uuid=True), ForeignKey("salary_structures.id", ondelete="RESTRICT"), nullable=True)
    pay_group_id = Column(UUID(as_uuid=True), ForeignKey("pay_groups.id", ondelete="SET NULL"), nullable=True)
    ctc = Column(Float, default=0.0, nullable=False)
    effective_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="active", nullable=False) # active, inactive
    revisions_json = Column(JSON, default=list, nullable=False) # Revision history list

    employee = relationship("Employee")
    structure = relationship("SalaryStructure")
    pay_group = relationship("PayGroup")


class PayrollAdjustment(TenantBaseModel):
    __tablename__ = "payroll_adjustments"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(String, nullable=False) # earning, deduction
    amount = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    approved_by = Column(String, nullable=True)
    is_processed = Column(Boolean, default=False, nullable=False)

    employee = relationship("Employee")
    payroll_run = relationship("PayrollRun")


class PayrollLoan(TenantBaseModel):
    __tablename__ = "payroll_loans"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    principal_amount = Column(Float, nullable=False)
    interest_rate = Column(Float, default=0.0, nullable=False)
    emi_amount = Column(Float, nullable=False)
    installments = Column(Integer, nullable=False)
    paid_installments = Column(Integer, default=0, nullable=False)
    outstanding_balance = Column(Float, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False) # pending, approved, active, fully_paid, rejected
    approved_by = Column(String, nullable=True)

    employee = relationship("Employee")


class PayrollReimbursement(TenantBaseModel):
    __tablename__ = "payroll_reimbursements"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False) # travel, food, medical, mobile, client_expense, other
    amount = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    receipt_url = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    claim_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_by = Column(String, nullable=True)

    employee = relationship("Employee")


class PayrollLedger(TenantBaseModel):
    __tablename__ = "payroll_ledgers"

    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    disbursed_amount = Column(Float, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, paid
    reference_number = Column(String, nullable=True)
    disbursed_at = Column(DateTime, nullable=True)

    payroll_run = relationship("PayrollRun")
    employee = relationship("Employee")
