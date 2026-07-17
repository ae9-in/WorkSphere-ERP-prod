from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from fastapi import HTTPException
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
import uuid
import random

from app.models.finance import (
    Account, JournalEntry, JournalItem,
    ExpenseClaim, ExpenseLine, ExpensePolicy,
    Invoice, InvoiceItem, InvoicePayment,
    Budget, BudgetForecast, BudgetVariance,
    TaxFiling, TaxTransaction
)
from app.models.employee import Employee
from app.models.user import User

class FinanceService:
    @staticmethod
    def ensure_seeded(db: Session, tenant_id: uuid.UUID):
        """Auto-seeds basic Chart of Accounts and dummy data for clean dashboards if empty."""
        account_count = db.query(Account).filter(Account.tenant_id == tenant_id).count()
        if account_count > 0:
            return

        # 1. Chart of Accounts standard seed
        seed_accounts = [
            # ASSETS
            {"code": "1000", "name": "Assets", "type": "asset", "parent_code": None},
            {"code": "1100", "name": "Current Assets", "type": "asset", "parent_code": "1000"},
            {"code": "1200", "name": "Bank Accounts", "type": "asset", "parent_code": "1100"},
            {"code": "1201", "name": "HDFC Operating Bank", "type": "asset", "parent_code": "1200"},
            {"code": "1300", "name": "Accounts Receivable", "type": "asset", "parent_code": "1100"},
            {"code": "1500", "name": "Fixed Assets", "type": "asset", "parent_code": "1000"},
            # LIABILITIES
            {"code": "2000", "name": "Liabilities", "type": "liability", "parent_code": None},
            {"code": "2100", "name": "Accounts Payable", "type": "liability", "parent_code": "2000"},
            {"code": "2200", "name": "Tax Accounts", "type": "liability", "parent_code": "2000"},
            {"code": "2201", "name": "GST Input Credit", "type": "liability", "parent_code": "2200"},
            {"code": "2202", "name": "GST Output Payable", "type": "liability", "parent_code": "2200"},
            # EQUITY
            {"code": "3000", "name": "Equity", "type": "equity", "parent_code": None},
            {"code": "3100", "name": "Share Capital", "type": "equity", "parent_code": "3000"},
            {"code": "3200", "name": "Retained Earnings", "type": "equity", "parent_code": "3000"},
            # INCOME
            {"code": "4000", "name": "Income", "type": "income", "parent_code": None},
            {"code": "4100", "name": "Product Sales", "type": "income", "parent_code": "4000"},
            {"code": "4200", "name": "Consulting Services", "type": "income", "parent_code": "4000"},
            # EXPENSES
            {"code": "5000", "name": "Expenses", "type": "expense", "parent_code": None},
            {"code": "5100", "name": "Office Supplies", "type": "expense", "parent_code": "5000"},
            {"code": "5200", "name": "Travel & Lodging", "type": "expense", "parent_code": "5000"},
            {"code": "5300", "name": "Salaries & Benefits", "type": "expense", "parent_code": "5000"},
        ]

        acc_map = {}
        for sa in seed_accounts:
            parent_id = None
            if sa["parent_code"]:
                parent_id = acc_map.get(sa["parent_code"])
            acc = Account(
                tenant_id=tenant_id,
                code=sa["code"],
                name=sa["name"],
                type=sa["type"],
                parent_id=parent_id,
                status="active"
            )
            db.add(acc)
            db.flush()
            acc_map[sa["code"]] = acc.id

        db.commit()

    @staticmethod
    def get_dashboard(db: Session, tenant_id: uuid.UUID) -> dict:
        FinanceService.ensure_seeded(db, tenant_id)

        # Receivables & Payables
        receivables = db.query(func.sum(Invoice.balance_due)).filter(
            Invoice.tenant_id == tenant_id, Invoice.status != "cancelled"
        ).scalar() or 0.0

        # Claims
        pending_claims = db.query(func.sum(ExpenseClaim.total_amount)).filter(
            ExpenseClaim.tenant_id == tenant_id, ExpenseClaim.status == "submitted"
        ).scalar() or 0.0

        # Revenue
        revenue = db.query(func.sum(Invoice.total_amount)).filter(
            Invoice.tenant_id == tenant_id, Invoice.status == "paid"
        ).scalar() or 0.0

        # Total allocated budget
        total_budget = db.query(func.sum(Budget.allocated_amount)).filter(
            Budget.tenant_id == tenant_id, Budget.fiscal_year == 2026
        ).scalar() or 0.0

        total_spent = db.query(func.sum(Budget.spent_amount)).filter(
            Budget.tenant_id == tenant_id, Budget.fiscal_year == 2026
        ).scalar() or 0.0

        # Calculate dynamic trend
        trend = []
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        current_year = date.today().year
        for m_idx in range(1, 7): # Show first 6 months
            start_d = date(current_year, m_idx, 1)
            if m_idx == 12:
                end_d = date(current_year + 1, 1, 1)
            else:
                end_d = date(current_year, m_idx + 1, 1)

            rev_m = db.query(func.sum(Invoice.total_amount)).filter(
                Invoice.tenant_id == tenant_id,
                Invoice.status == "paid",
                Invoice.issue_date >= start_d,
                Invoice.issue_date < end_d
            ).scalar() or 0.0

            exp_m = db.query(func.sum(ExpenseClaim.total_amount)).filter(
                ExpenseClaim.tenant_id == tenant_id,
                ExpenseClaim.status == "paid",
                ExpenseClaim.date >= start_d,
                ExpenseClaim.date < end_d
            ).scalar() or 0.0

            trend.append({
                "month": months[m_idx - 1],
                "revenue": rev_m,
                "expense": exp_m
            })

        return {
            "totalAssets": 0.0,
            "totalLiabilities": 0.0,
            "netProfit": max(revenue - total_spent, 0.0),
            "monthlyRevenue": revenue,
            "cashFlow": revenue - total_spent,
            "outstandingReceivables": receivables,
            "outstandingPayables": pending_claims,
            "budgetAllocated": total_budget,
            "budgetUsed": total_spent,
            "financialTrend": trend
        }

    @staticmethod
    def get_accounts(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        FinanceService.ensure_seeded(db, tenant_id)
        accounts = db.query(Account).filter(Account.tenant_id == tenant_id).all()
        return [{
            "id": str(a.id),
            "code": a.code,
            "name": a.name,
            "type": a.type,
            "parent_id": str(a.parent_id) if a.parent_id else None,
            "status": a.status,
            "description": a.description
        } for a in accounts]

    @staticmethod
    def create_account(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        acc = Account(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            type=payload.type,
            parent_id=uuid.UUID(payload.parent_id) if payload.parent_id else None,
            description=payload.description
        )
        db.add(acc)
        db.commit()
        db.refresh(acc)
        return {"id": str(acc.id), "code": acc.code, "name": acc.name}

    @staticmethod
    def get_journal_entries(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        entries = db.query(JournalEntry).filter(JournalEntry.tenant_id == tenant_id).all()
        res = []
        for e in entries:
            res.append({
                "id": str(e.id),
                "entryNumber": e.entry_number,
                "date": e.date.isoformat(),
                "status": e.status,
                "narration": e.narration,
                "reference": e.reference,
                "branch": e.branch,
                "costCenter": e.cost_center,
                "items": [{
                    "id": str(item.id),
                    "accountName": item.account.name,
                    "debit": item.debit,
                    "credit": item.credit,
                    "description": item.description
                } for item in e.items]
            })
        return res

    @staticmethod
    def create_journal_entry(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        # 1. Validation: Debits must balance Credits
        total_debit = sum(item.debit for item in payload.items)
        total_credit = sum(item.credit for item in payload.items)
        if abs(total_debit - total_credit) > 0.01:
            raise HTTPException(status_code=400, detail="Trial balance failure: total debits must match total credits.")

        entry_number = f"JV-2026-{random.randint(1000, 9999)}"
        entry = JournalEntry(
            tenant_id=tenant_id,
            entry_number=entry_number,
            date=datetime.strptime(payload.date, "%Y-%m-%d").date(),
            status="posted",
            narration=payload.narration,
            reference=payload.reference,
            branch=payload.branch,
            cost_center=payload.costCenter
        )
        db.add(entry)
        db.flush()

        for item in payload.items:
            db.add(JournalItem(
                entry_id=entry.id,
                account_id=uuid.UUID(item.accountId),
                debit=item.debit,
                credit=item.credit,
                description=item.description,
                partner_type=item.partnerType,
                partner_id=uuid.UUID(item.partnerId) if item.partnerId else None
            ))
        db.commit()
        db.refresh(entry)
        return {"id": str(entry.id), "entryNumber": entry.entry_number}

    @staticmethod
    def get_invoices(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        FinanceService.ensure_seeded(db, tenant_id)
        invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant_id).all()
        return [{
            "id": str(i.id),
            "invoiceNumber": i.invoice_number,
            "customerName": i.customer_name,
            "customerEmail": i.customer_email,
            "issueDate": i.issue_date.isoformat(),
            "dueDate": i.due_date.isoformat(),
            "status": i.status,
            "totalAmount": i.total_amount,
            "balanceDue": i.balance_due,
            "items": [{
                "productName": item.product_name,
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
                "totalAmount": item.total_amount
            } for item in i.items]
        } for i in invoices]

    @staticmethod
    def create_invoice(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        inv_number = f"INV-2026-{random.randint(1000, 9999)}"
        
        # Calculate totals
        items_total = 0.0
        for item in payload.items:
            items_total += item.quantity * item.unitPrice * (1.0 - item.discount / 100.0)

        tax_amount = items_total * (payload.taxRate / 100.0)
        total_amount = (items_total - payload.discount) + tax_amount

        inv = Invoice(
            tenant_id=tenant_id,
            invoice_number=inv_number,
            customer_name=payload.customerName,
            customer_email=payload.customerEmail,
            issue_date=datetime.strptime(payload.issueDate, "%Y-%m-%d").date(),
            due_date=datetime.strptime(payload.dueDate, "%Y-%m-%d").date(),
            status="sent",
            discount=payload.discount,
            tax_rate=payload.taxRate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            balance_due=total_amount
        )
        db.add(inv)
        db.flush()

        for item in payload.items:
            line_total = item.quantity * item.unitPrice * (1.0 - item.discount / 100.0)
            db.add(InvoiceItem(
                invoice_id=inv.id,
                product_name=item.productName,
                quantity=item.quantity,
                unit_price=item.unitPrice,
                discount=item.discount,
                hsn_code=item.hsnCode,
                tax_rate=item.taxRate,
                tax_amount=line_total * (item.taxRate / 100.0),
                total_amount=line_total * (1.0 + item.taxRate / 100.0)
            ))
        db.commit()
        db.refresh(inv)
        return {"id": str(inv.id), "invoiceNumber": inv.invoice_number}

    @staticmethod
    def record_payment(db: Session, invoice_id: str, payload: Any, tenant_id: uuid.UUID) -> dict:
        inv = db.query(Invoice).filter(
            Invoice.id == uuid.UUID(invoice_id), Invoice.tenant_id == tenant_id
        ).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")

        payment = InvoicePayment(
            invoice_id=inv.id,
            payment_date=datetime.strptime(payload.paymentDate, "%Y-%m-%d").date(),
            amount=payload.amount,
            payment_method=payload.paymentMethod,
            reference_no=payload.referenceNo,
            notes=payload.notes
        )
        db.add(payment)
        
        inv.balance_due = max(inv.balance_due - payload.amount, 0.0)
        if inv.balance_due == 0.0:
            inv.status = "paid"
        else:
            inv.status = "partially_paid"

        db.commit()
        return {"status": inv.status, "balanceDue": inv.balance_due}

    @staticmethod
    def get_expense_claims(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        FinanceService.ensure_seeded(db, tenant_id)
        claims = db.query(ExpenseClaim).filter(ExpenseClaim.tenant_id == tenant_id).all()
        return [{
            "id": str(c.id),
            "claimNumber": c.claim_number,
            "employeeName": c.employee.full_name if c.employee else "General Office",
            "date": c.date.isoformat(),
            "status": c.status,
            "totalAmount": c.total_amount,
            "currency": c.currency,
            "notes": c.notes,
            "lines": [{
                "category": line.category,
                "date": line.date.isoformat(),
                "description": line.description,
                "amount": line.amount,
                "merchant": line.merchant
            } for line in c.lines]
        } for c in claims]

    @staticmethod
    def create_expense_claim(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        claim_number = f"EXP-2026-{random.randint(1000, 9999)}"
        total = sum(line.amount for line in payload.lines)

        claim = ExpenseClaim(
            tenant_id=tenant_id,
            claim_number=claim_number,
            date=datetime.strptime(payload.date, "%Y-%m-%d").date(),
            status="submitted",
            total_amount=total,
            notes=payload.notes
        )
        db.add(claim)
        db.flush()

        for line in payload.lines:
            db.add(ExpenseLine(
                claim_id=claim.id,
                category=line.category,
                date=datetime.strptime(line.date, "%Y-%m-%d").date(),
                description=line.description,
                amount=line.amount,
                tax_amount=line.taxAmount,
                merchant=line.merchant,
                receipt_url=line.receiptUrl
            ))
        db.commit()
        db.refresh(claim)
        return {"id": str(claim.id), "claimNumber": claim.claim_number}

    @staticmethod
    def get_budgets(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        FinanceService.ensure_seeded(db, tenant_id)
        budgets = db.query(Budget).filter(Budget.tenant_id == tenant_id).all()
        return [{
            "id": str(b.id),
            "departmentName": b.department_name,
            "fiscalYear": b.fiscal_year,
            "quarter": b.quarter,
            "allocatedAmount": b.allocated_amount,
            "spentAmount": b.spent_amount,
            "status": b.status
        } for b in budgets]

    @staticmethod
    def create_budget(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        b = Budget(
            tenant_id=tenant_id,
            department_name=payload.departmentName,
            fiscal_year=payload.fiscalYear,
            quarter=payload.quarter,
            allocated_amount=payload.allocatedAmount,
            spent_amount=0.0,
            status="approved"
        )
        db.add(b)
        db.commit()
        db.refresh(b)
        return {"id": str(b.id), "departmentName": b.department_name}

    @staticmethod
    def get_tax_filings(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        FinanceService.ensure_seeded(db, tenant_id)
        filings = db.query(TaxFiling).filter(TaxFiling.tenant_id == tenant_id).all()
        return [{
            "id": str(tf.id),
            "taxType": tf.tax_type,
            "filingPeriod": tf.filing_period,
            "dueDate": tf.due_date.isoformat(),
            "status": tf.status,
            "amountDue": tf.amount_due,
            "amountPaid": tf.amount_paid,
            "returnForm": tf.return_form
        } for tf in filings]

    @staticmethod
    def create_tax_filing(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        tf = TaxFiling(
            tenant_id=tenant_id,
            tax_type=payload.taxType,
            filing_period=payload.filingPeriod,
            due_date=datetime.strptime(payload.dueDate, "%Y-%m-%d").date(),
            amount_due=payload.amountDue,
            amount_paid=0.0,
            status="pending",
            return_form=payload.returnForm
        )
        db.add(tf)
        db.commit()
        db.refresh(tf)
        return {"id": str(tf.id), "taxType": tf.tax_type}
