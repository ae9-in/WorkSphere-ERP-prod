from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.finance import FinanceService
from app.schemas.finance import (
    AccountCreate, JournalEntryCreate, InvoiceCreate,
    InvoicePaymentCreate, ExpenseClaimCreate, BudgetCreate, TaxFilingCreate
)

router = APIRouter(prefix="/finance", tags=["Finance & Accounting"])

@router.get("/dashboard", summary="Get corporate financial KPIs and monthly cash flow trends")
def get_dashboard(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_dashboard(db, user.company_id)}

@router.get("/accounts", summary="Get Chart of Accounts list")
def get_accounts(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_accounts(db, user.company_id)}

@router.post("/accounts", status_code=status.HTTP_201_CREATED, summary="Create a new account node")
def create_account(payload: AccountCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.create_account(db, payload, user.company_id)}

@router.get("/journals", summary="Get list of posted journals")
def get_journals(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_journal_entries(db, user.company_id)}

@router.post("/journals", status_code=status.HTTP_201_CREATED, summary="Post double-entry journal voucher")
def create_journal(payload: JournalEntryCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.create_journal_entry(db, payload, user.company_id)}

@router.get("/invoices", summary="Get list of customer invoices")
def get_invoices(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_invoices(db, user.company_id)}

@router.post("/invoices", status_code=status.HTTP_201_CREATED, summary="Create invoice draft")
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.create_invoice(db, payload, user.company_id)}

@router.post("/invoices/{invoice_id}/payments", status_code=status.HTTP_201_CREATED, summary="Post customer invoice collection payment")
def record_payment(invoice_id: str, payload: InvoicePaymentCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.record_payment(db, invoice_id, payload, user.company_id)}

@router.get("/expenses", summary="Get list of corporate expense claims")
def get_expenses(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_expense_claims(db, user.company_id)}

@router.post("/expenses", status_code=status.HTTP_201_CREATED, summary="Submit a new employee expense claim")
def create_expense_claim(payload: ExpenseClaimCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.create_expense_claim(db, payload, user.company_id)}

@router.get("/budgets", summary="Get cost center budget allocations")
def get_budgets(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_budgets(db, user.company_id)}

@router.post("/budgets", status_code=status.HTTP_201_CREATED, summary="Log a new department budget")
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.create_budget(db, payload, user.company_id)}

@router.get("/taxes", summary="Get TDS & GST filings timeline")
def get_taxes(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.get_tax_filings(db, user.company_id)}

@router.post("/taxes", status_code=status.HTTP_201_CREATED, summary="Register a compliance tax filing obligation")
def create_tax(payload: TaxFilingCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": FinanceService.create_tax_filing(db, payload, user.company_id)}
