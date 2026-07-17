from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Integer, JSON, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.base import TenantBaseModel, BaseModel

class Account(TenantBaseModel):
    __tablename__ = "finance_accounts"

    code         = Column(String, nullable=False, unique=True, index=True)
    name         = Column(String, nullable=False)
    type         = Column(String, nullable=False)  # asset, liability, equity, income, expense
    parent_id    = Column(UUID(as_uuid=True), ForeignKey("finance_accounts.id", ondelete="SET NULL"), nullable=True)
    status       = Column(String, default="active", nullable=False)  # active, archived
    description  = Column(Text, nullable=True)

    parent       = relationship("Account", remote_side="Account.id", backref="children")

class JournalEntry(TenantBaseModel):
    __tablename__ = "finance_journal_entries"

    entry_number = Column(String, nullable=False, unique=True, index=True)
    date         = Column(Date, nullable=False)
    status       = Column(String, default="draft", nullable=False)  # draft, posted, reversed
    narration    = Column(Text, nullable=True)
    reference    = Column(String, nullable=True)
    branch       = Column(String, default="HQ", nullable=False)
    cost_center  = Column(String, nullable=True)
    reversed_entry_id = Column(UUID(as_uuid=True), nullable=True)

    items        = relationship("JournalItem", back_populates="entry", cascade="all, delete-orphan")

class JournalItem(BaseModel):
    __tablename__ = "finance_journal_items"

    entry_id     = Column(UUID(as_uuid=True), ForeignKey("finance_journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_id   = Column(UUID(as_uuid=True), ForeignKey("finance_accounts.id", ondelete="RESTRICT"), nullable=False)
    debit        = Column(Float, default=0.0, nullable=False)
    credit       = Column(Float, default=0.0, nullable=False)
    description  = Column(Text, nullable=True)
    partner_type = Column(String, nullable=True)  # vendor, customer, employee
    partner_id   = Column(UUID(as_uuid=True), nullable=True)

    entry        = relationship("JournalEntry", back_populates="items")
    account      = relationship("Account")

class ExpenseClaim(TenantBaseModel):
    __tablename__ = "finance_expense_claims"

    claim_number   = Column(String, nullable=False, unique=True, index=True)
    employee_id    = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    date           = Column(Date, nullable=False)
    status         = Column(String, default="draft", nullable=False)  # draft, submitted, approved, paid, rejected
    total_amount   = Column(Float, default=0.0, nullable=False)
    currency       = Column(String, default="INR", nullable=False)
    notes          = Column(Text, nullable=True)

    employee       = relationship("Employee")
    lines          = relationship("ExpenseLine", back_populates="claim", cascade="all, delete-orphan")

class ExpenseLine(BaseModel):
    __tablename__ = "finance_expense_lines"

    claim_id     = Column(UUID(as_uuid=True), ForeignKey("finance_expense_claims.id", ondelete="CASCADE"), nullable=False)
    category     = Column(String, nullable=False)  # travel, food, mileage, hotel, fuel, office_supplies, medical, entertainment, project
    date         = Column(Date, nullable=False)
    description  = Column(Text, nullable=True)
    amount       = Column(Float, default=0.0, nullable=False)
    tax_amount   = Column(Float, default=0.0, nullable=False)
    merchant     = Column(String, nullable=True)
    receipt_url  = Column(String, nullable=True)

    claim        = relationship("ExpenseClaim", back_populates="lines")

class ExpensePolicy(TenantBaseModel):
    __tablename__ = "finance_expense_policies"

    department_name = Column(String, nullable=False)
    designation     = Column(String, nullable=True)
    max_limit       = Column(Float, default=0.0, nullable=False)
    rules           = Column(JSON, default=dict, nullable=False)

class Invoice(TenantBaseModel):
    __tablename__ = "finance_invoices"

    invoice_number = Column(String, nullable=False, unique=True, index=True)
    customer_name  = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    issue_date     = Column(Date, nullable=False)
    due_date       = Column(Date, nullable=False)
    status         = Column(String, default="draft", nullable=False)  # draft, sent, paid, partially_paid, overdue, cancelled
    discount       = Column(Float, default=0.0, nullable=False)
    tax_rate       = Column(Float, default=0.0, nullable=False)
    tax_amount     = Column(Float, default=0.0, nullable=False)
    total_amount   = Column(Float, default=0.0, nullable=False)
    balance_due    = Column(Float, default=0.0, nullable=False)
    recurring      = Column(Boolean, default=False, nullable=False)
    payment_terms  = Column(String, nullable=True)

    items          = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments       = relationship("InvoicePayment", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(BaseModel):
    __tablename__ = "finance_invoice_items"

    invoice_id   = Column(UUID(as_uuid=True), ForeignKey("finance_invoices.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity     = Column(Integer, default=1, nullable=False)
    unit_price   = Column(Float, default=0.0, nullable=False)
    discount     = Column(Float, default=0.0, nullable=False)
    hsn_code     = Column(String, nullable=True)
    tax_rate     = Column(Float, default=0.0, nullable=False)
    tax_amount   = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)

    invoice      = relationship("Invoice", back_populates="items")

class InvoicePayment(BaseModel):
    __tablename__ = "finance_invoice_payments"

    invoice_id   = Column(UUID(as_uuid=True), ForeignKey("finance_invoices.id", ondelete="CASCADE"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount       = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String, nullable=False)  # stripe, razorpay, cash, cheque, bank_transfer
    reference_no = Column(String, nullable=True)
    notes        = Column(Text, nullable=True)

    invoice      = relationship("Invoice", back_populates="payments")

class Budget(TenantBaseModel):
    __tablename__ = "finance_budgets"

    department_name = Column(String, nullable=False)
    fiscal_year     = Column(Integer, nullable=False)
    quarter         = Column(String, nullable=True)  # Q1, Q2, Q3, Q4
    allocated_amount = Column(Float, default=0.0, nullable=False)
    spent_amount     = Column(Float, default=0.0, nullable=False)
    status          = Column(String, default="draft", nullable=False)  # draft, approved, closed

class BudgetForecast(TenantBaseModel):
    __tablename__ = "finance_budget_forecasts"

    fiscal_year     = Column(Integer, nullable=False)
    month           = Column(Integer, nullable=False)  # 1-12
    forecast_revenue = Column(Float, default=0.0, nullable=False)
    forecast_expense = Column(Float, default=0.0, nullable=False)
    ai_suggestions  = Column(JSON, default=list, nullable=False)

class BudgetVariance(TenantBaseModel):
    __tablename__ = "finance_budget_variances"

    budget_id       = Column(UUID(as_uuid=True), ForeignKey("finance_budgets.id", ondelete="CASCADE"), nullable=False)
    month           = Column(Integer, nullable=False)
    actual_spend    = Column(Float, default=0.0, nullable=False)
    budget_spend    = Column(Float, default=0.0, nullable=False)
    variance_amount = Column(Float, default=0.0, nullable=False)
    variance_pct    = Column(Float, default=0.0, nullable=False)
    root_cause      = Column(Text, nullable=True)
    comments        = Column(Text, nullable=True)

    budget          = relationship("Budget")

class TaxFiling(TenantBaseModel):
    __tablename__ = "finance_tax_filings"

    tax_type       = Column(String, nullable=False)  # GST, TDS, CorporateTax
    filing_period  = Column(String, nullable=False)  # e.g., "June 2026", "Q2 2026"
    due_date       = Column(Date, nullable=False)
    status         = Column(String, default="pending", nullable=False)  # pending, filed, overdue
    amount_due     = Column(Float, default=0.0, nullable=False)
    amount_paid    = Column(Float, default=0.0, nullable=False)
    payment_date   = Column(Date, nullable=True)
    reference_no   = Column(String, nullable=True)
    return_form    = Column(String, nullable=True)  # GSTR1, GSTR3B, TDS-24Q

class TaxTransaction(TenantBaseModel):
    __tablename__ = "finance_tax_transactions"

    transaction_type = Column(String, nullable=False)  # sale, purchase
    base_amount      = Column(Float, default=0.0, nullable=False)
    tax_rate         = Column(Float, default=0.0, nullable=False)
    tax_amount       = Column(Float, default=0.0, nullable=False)
    account_id       = Column(UUID(as_uuid=True), ForeignKey("finance_accounts.id", ondelete="RESTRICT"), nullable=True)
    reference_model  = Column(String, nullable=True)  # e.g. "Invoice", "ExpenseLine"
    reference_id     = Column(UUID(as_uuid=True), nullable=True)

    account          = relationship("Account")
