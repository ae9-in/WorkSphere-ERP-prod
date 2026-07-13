from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks
from datetime import datetime
import calendar
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.payroll import PayrollRepository
from app.models.payroll import (
    SalaryStructure, SalaryStructureComponent, PayrollRun, Payslip,
    PayrollCalendar, PayGroup, EmployeeSalary, PayrollAdjustment,
    PayrollLoan, PayrollReimbursement, PayrollLedger
)
from app.models.employee import Employee
from app.models.settings import CompanySettings
from app.models.attendance import Attendance
from app.models.audit import AuditLog
from app.core.database import SessionLocal
from app.schemas.payroll import (
    PayrollRunCreateSchema, SalaryStructureCreateSchema,
    PayrollCalendarCreateSchema, PayGroupCreateSchema,
    EmployeeSalaryAssignSchema, PayrollAdjustmentCreateSchema,
    PayrollLoanCreateSchema, PayrollReimbursementCreateSchema
)

payroll_repo = PayrollRepository()

def serialize_payslip(payslip: Payslip) -> dict:
    return {
        "_id": str(payslip.id),
        "employeeId": payslip.employee.employee_id if payslip.employee else "",
        "employeeName": payslip.employee.full_name if payslip.employee else "",
        "employeeSnapshot": payslip.employee_snapshot or {},
        "payPeriod": payslip.pay_period or {},
        "earnings": payslip.earnings or [],
        "deductions": payslip.deductions or [],
        "totals": payslip.totals or {},
        "ytd": payslip.ytd or {},
        "status": payslip.status,
        "companyId": str(payslip.tenant_id),
        "payrollRunId": str(payslip.payroll_run_id)
    }

def process_payroll_run_bg(run_id: uuid.UUID, tenant_id: uuid.UUID, author_id: uuid.UUID):
    db = SessionLocal()
    try:
        run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
        if not run:
            return
            
        employees = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.status == "active", Employee.deleted_at == None).all()
        settings = db.query(CompanySettings).filter(CompanySettings.tenant_id == tenant_id, CompanySettings.deleted_at == None).first()
        
        basic_pct = settings.basic_percent if settings else 40.0
        hra_pct = settings.hra_percent if settings else 50.0
        pf_enabled = settings.pf_enabled if settings else True
        esi_enabled = settings.esi_enabled if settings else True
        
        total_employees = 0
        total_gross = 0.0
        total_deductions = 0.0
        total_net_pay = 0.0
        
        db.query(Payslip).filter(Payslip.payroll_run_id == run_id).delete()
        
        working_days = calendar.monthrange(run.year, run.month)[1]
        start_date = datetime(run.year, run.month, 1)
        end_date = datetime(run.year, run.month, working_days)
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        
        for emp in employees:
            # 1. Fetch EmployeeSalary assignment
            emp_sal = db.query(EmployeeSalary).filter(
                EmployeeSalary.employee_id == emp.id,
                EmployeeSalary.status == "active",
                EmployeeSalary.tenant_id == tenant_id
            ).first()
            
            ctc = emp_sal.ctc if emp_sal else (emp.ctc if emp.ctc else 600000.0)
            monthly_ctc = ctc / 12.0
            
            # 2. Compute LOP Days: absent days from Attendance + lop_days from approved LeaveApplication
            absent_count = db.query(Attendance).filter(
                Attendance.tenant_id == tenant_id,
                Attendance.employee_id == emp.id,
                Attendance.date >= start_date_str,
                Attendance.date <= end_date_str,
                Attendance.status == "absent",
                Attendance.deleted_at == None
            ).count()
            
            from app.models.leave import LeaveApplication
            leaves = db.query(LeaveApplication).filter(
                LeaveApplication.employee_id == emp.id,
                LeaveApplication.tenant_id == tenant_id,
                LeaveApplication.status == "approved",
                LeaveApplication.from_date >= start_date,
                LeaveApplication.to_date <= end_date,
                LeaveApplication.deleted_at == None
            ).all()
            
            leave_lop = sum(float(l.lop_days) for l in leaves)
            lop_days = float(absent_count) + leave_lop
            present_days = float(working_days) - lop_days
            if present_days < 0.0:
                present_days = 0.0
                
            # LOP deduction = lop_days * (monthly_ctc / working_days)
            lop_deduction = lop_days * (monthly_ctc / working_days)
            actual_gross = monthly_ctc - lop_deduction
            if actual_gross < 0.0:
                actual_gross = 0.0
                
            # 3. Base salary breakdown using assigned structure or default percentages
            structure = emp_sal.structure if (emp_sal and emp_sal.structure) else None
            earnings_list = []
            deductions_list = []
            
            if structure:
                basic = 0.0
                for comp in sorted(structure.components, key=lambda c: c.display_order):
                    val = 0.0
                    if comp.calc_type == "fixed":
                        val = comp.value
                    elif comp.calc_type == "pct_ctc":
                        val = (comp.value / 100.0) * actual_gross
                    elif comp.calc_type == "pct_basic":
                        val = (comp.value / 100.0) * basic
                        
                    if comp.code == "BASIC":
                        basic = val
                        
                    if comp.type == "earning":
                        earnings_list.append({"code": comp.code, "name": comp.name, "amount": round(val, 2)})
                    elif comp.type == "deduction":
                        deductions_list.append({"code": comp.code, "name": comp.name, "amount": round(val, 2)})
            else:
                basic = actual_gross * (basic_pct / 100.0)
                hra = basic * (hra_pct / 100.0)
                special = actual_gross - basic - hra
                earnings_list = [
                    {"code": "BASIC", "name": "Basic Salary", "amount": round(basic, 2)},
                    {"code": "HRA", "name": "House Rent Allowance", "amount": round(hra, 2)},
                    {"code": "SPECIAL", "name": "Special Allowance", "amount": round(special, 2)}
                ]
                
            # 4. Professional Tax, PF, ESI statutory calculations
            pf = 0.0
            if pf_enabled:
                # PF is 12% of basic, basic capped at 15000 for standard statutory PF limit
                pf = min(basic, 15000.0) * 0.12
            if pf > 0.0:
                deductions_list.append({"code": "PF", "name": "Provident Fund", "amount": round(pf, 2)})
                
            esi = 0.0
            if esi_enabled and actual_gross <= 21000.0:
                # ESI is 0.75% of actual gross
                esi = actual_gross * 0.0075
            if esi > 0.0:
                deductions_list.append({"code": "ESI", "name": "Employee State Insurance", "amount": round(esi, 2)})
                
            # Professional Tax: Rs 200/month if gross exceeds 15,000
            pt = 0.0
            if actual_gross > 15000.0:
                pt = 200.0
                deductions_list.append({"code": "PT", "name": "Professional Tax", "amount": round(pt, 2)})
                
            # 5. Loan Recovery EMIs
            loan_deduction = 0.0
            active_loan = db.query(PayrollLoan).filter(
                PayrollLoan.employee_id == emp.id,
                PayrollLoan.status == "active",
                PayrollLoan.tenant_id == tenant_id
            ).first()
            if active_loan:
                loan_deduction = min(active_loan.emi_amount, active_loan.outstanding_balance)
                deductions_list.append({
                    "code": f"LOAN_{str(active_loan.id)[:8].upper()}",
                    "name": f"Loan Recovery EMI",
                    "amount": round(loan_deduction, 2)
                })
                
            # 6. Manual Adjustments (One-time earnings/deductions)
            adj_earnings = 0.0
            adj_deductions = 0.0
            adjs = db.query(PayrollAdjustment).filter(
                PayrollAdjustment.employee_id == emp.id,
                PayrollAdjustment.is_processed == False,
                PayrollAdjustment.tenant_id == tenant_id
            ).all()
            for adj in adjs:
                if adj.type == "earning":
                    adj_earnings += adj.amount
                    earnings_list.append({"code": f"ADJ_{str(adj.id)[:8].upper()}", "name": f"Adjustment: {adj.reason}", "amount": round(adj.amount, 2)})
                else:
                    adj_deductions += adj.amount
                    deductions_list.append({"code": f"ADJ_{str(adj.id)[:8].upper()}", "name": f"Adjustment: {adj.reason}", "amount": round(adj.amount, 2)})
            
            # 7. Reimbursements (Add as non-taxable earnings)
            reimb_total = 0.0
            reimbs = db.query(PayrollReimbursement).filter(
                PayrollReimbursement.employee_id == emp.id,
                PayrollReimbursement.status == "approved",
                PayrollReimbursement.tenant_id == tenant_id
            ).all()
            for r in reimbs:
                reimb_total += r.amount
                earnings_list.append({"code": f"REIMB_{str(r.id)[:8].upper()}", "name": f"Reimbursement: {r.category.upper()}", "amount": round(r.amount, 2)})

            # Total computations
            sub_earnings = sum(e["amount"] for e in earnings_list)
            sub_deductions = sum(d["amount"] for d in deductions_list)
            net_pay = sub_earnings - sub_deductions
            if net_pay < 0.0:
                net_pay = 0.0
                
            payslip = Payslip(
                tenant_id=tenant_id,
                payroll_run_id=run.id,
                employee_id=emp.id,
                employee_snapshot={
                    "fullName": emp.full_name,
                    "designation": emp.designation_name,
                    "department": emp.department_name,
                    "pan": emp.personal_phone or ""
                },
                pay_period={
                    "workingDays": working_days,
                    "presentDays": present_days,
                    "lopDays": lop_days,
                    "overtimeHours": 0
                },
                earnings=earnings_list,
                deductions=deductions_list,
                totals={
                    "gross": round(sub_earnings, 2),
                    "deductions": round(sub_deductions, 2),
                    "net": round(net_pay, 2),
                    "ctc": round(monthly_ctc, 2)
                },
                ytd={
                    "gross": round(sub_earnings, 2),
                    "deductions": round(sub_deductions, 2),
                    "net": round(net_pay, 2)
                },
                status="draft"
            )
            db.add(payslip)
            
            total_employees += 1
            total_gross += sub_earnings
            total_deductions += sub_deductions
            total_net_pay += net_pay
            
        run.status = "completed"
        run.total_employees = total_employees
        run.total_gross = round(total_gross, 2)
        run.total_deductions = round(total_deductions, 2)
        run.total_net_pay = round(total_net_pay, 2)
        run.processed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        print("Payroll processing background job failed:", e)
        if run_id:
            try:
                run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
                if run:
                    run.status = "failed"
                    db.commit()
            except Exception:
                pass
    finally:
        db.close()

class PayrollService:
    @staticmethod
    def get_runs(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        runs = db.query(PayrollRun).filter(PayrollRun.tenant_id == tenant_id, PayrollRun.deleted_at == None).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).all()
        res_data = []
        for run in runs:
            res_data.append({
                "_id": str(run.id),
                "month": run.month,
                "year": run.year,
                "period": run.period,
                "status": run.status,
                "totalEmployees": run.total_employees,
                "totalGross": run.total_gross,
                "totalDeductions": run.total_deductions,
                "totalNetPay": run.total_net_pay,
                "processedAt": run.processed_at.strftime("%Y-%m-%d %H:%M:%S") if run.processed_at else None,
                "approvedAt": run.approved_at.strftime("%Y-%m-%d %H:%M:%S") if run.approved_at else None,
                "paidAt": run.paid_at.strftime("%Y-%m-%d %H:%M:%S") if run.paid_at else None
            })
        return res_data

    @staticmethod
    def create_run(db: Session, payload: PayrollRunCreateSchema, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        existing = db.query(PayrollRun).filter(
            PayrollRun.tenant_id == tenant_id,
            PayrollRun.month == payload.month,
            PayrollRun.year == payload.year,
            PayrollRun.deleted_at == None
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Payroll run already exists for this period")
            
        run = PayrollRun(
            tenant_id=tenant_id,
            month=payload.month,
            year=payload.year,
            period=f"{payload.month}/{payload.year}",
            status="draft",
            created_by=author_id
        )
        db.add(run)
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=str(author_id),
            action="PAYROLL_RUN_CREATED",
            details=f"Created payroll run for period {payload.month}/{payload.year}"
        )
        db.add(audit)
        db.commit()
        db.refresh(run)
        
        return {
            "_id": str(run.id),
            "month": run.month,
            "year": run.year,
            "period": run.period,
            "status": run.status
        }

    @staticmethod
    def process_run(db: Session, run_id: str, background_tasks: BackgroundTasks, tenant_id: uuid.UUID, author_id: uuid.UUID) -> bool:
        try:
            run_uuid = uuid.UUID(run_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payroll run ID format")
            
        run = db.query(PayrollRun).filter(PayrollRun.id == run_uuid, PayrollRun.tenant_id == tenant_id, PayrollRun.deleted_at == None).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")
            
        run.status = "processing"
        db.commit()
        
        background_tasks.add_task(process_payroll_run_bg, run.id, tenant_id, author_id)
        return True

    @staticmethod
    def recalculate_run(db: Session, run_id: str, background_tasks: BackgroundTasks, tenant_id: uuid.UUID, author_id: uuid.UUID) -> bool:
        return PayrollService.process_run(db, run_id, background_tasks, tenant_id, author_id)

    @staticmethod
    def approve_run(db: Session, run_id: str, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        try:
            run_uuid = uuid.UUID(run_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        run = db.query(PayrollRun).filter(PayrollRun.id == run_uuid, PayrollRun.tenant_id == tenant_id, PayrollRun.deleted_at == None).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")
            
        run.status = "approved"
        run.approved_at = datetime.utcnow()
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=str(author_id),
            action="PAYROLL_RUN_APPROVED",
            details=f"Approved payroll run ID {run.id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(run)
        return {"_id": str(run.id), "status": run.status}

    @staticmethod
    def lock_run(db: Session, run_id: str, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        try:
            run_uuid = uuid.UUID(run_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        run = db.query(PayrollRun).filter(PayrollRun.id == run_uuid, PayrollRun.tenant_id == tenant_id, PayrollRun.deleted_at == None).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")
            
        run.status = "paid"
        run.paid_at = datetime.utcnow()
        
        # Publish payslips
        payslips = db.query(Payslip).filter(Payslip.payroll_run_id == run_uuid).all()
        for p in payslips:
            p.status = "published"
            
            # 1. Update processed adjustments
            db.query(PayrollAdjustment).filter(
                PayrollAdjustment.employee_id == p.employee_id,
                PayrollAdjustment.is_processed == False,
                PayrollAdjustment.tenant_id == tenant_id
            ).update({"is_processed": True, "payroll_run_id": run_uuid})
            
            # 2. Update processed reimbursements (status = "processed")
            db.query(PayrollReimbursement).filter(
                PayrollReimbursement.employee_id == p.employee_id,
                PayrollReimbursement.status == "approved",
                PayrollReimbursement.tenant_id == tenant_id
            ).update({"status": "processed"})

            # 3. Deduct active loans
            active_loan = db.query(PayrollLoan).filter(
                PayrollLoan.employee_id == p.employee_id,
                PayrollLoan.status == "active",
                PayrollLoan.tenant_id == tenant_id
            ).first()
            if active_loan:
                emi_deducted = min(active_loan.emi_amount, active_loan.outstanding_balance)
                active_loan.outstanding_balance -= emi_deducted
                active_loan.paid_installments += 1
                if active_loan.outstanding_balance <= 0.0:
                    active_loan.status = "fully_paid"

            # 4. Write PayrollLedger entries
            ledger = PayrollLedger(
                tenant_id=tenant_id,
                payroll_run_id=run_uuid,
                employee_id=p.employee_id,
                disbursed_amount=p.totals["net"],
                status="paid",
                reference_number=f"DISB-{str(uuid.uuid4())[:8].upper()}",
                disbursed_at=datetime.utcnow()
            )
            db.add(ledger)
            
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=str(author_id),
            action="PAYROLL_RUN_LOCKED",
            details=f"Locked & paid payroll run ID {run.id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(run)
        return {"_id": str(run.id), "status": run.status}

    @staticmethod
    def reopen_run(db: Session, run_id: str, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        try:
            run_uuid = uuid.UUID(run_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        run = db.query(PayrollRun).filter(PayrollRun.id == run_uuid, PayrollRun.tenant_id == tenant_id, PayrollRun.deleted_at == None).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")
            
        run.status = "draft"
        
        # Reset payslips status to draft
        db.query(Payslip).filter(Payslip.payroll_run_id == run_uuid).update({"status": "draft"})
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=str(author_id),
            action="PAYROLL_RUN_REOPENED",
            details=f"Reopened payroll run ID {run.id} to draft state"
        )
        db.add(audit)
        db.commit()
        db.refresh(run)
        return {"_id": str(run.id), "status": run.status}

    @staticmethod
    def get_payslips_for_run(db: Session, run_id: str, tenant_id: uuid.UUID) -> List[dict]:
        try:
            run_uuid = uuid.UUID(run_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid run ID format")
            
        payslips = db.query(Payslip).filter(Payslip.payroll_run_id == run_uuid, Payslip.tenant_id == tenant_id, Payslip.deleted_at == None).all()
        return [serialize_payslip(p) for p in payslips]

    @staticmethod
    def get_payslip(db: Session, payslip_id: str, tenant_id: uuid.UUID) -> dict:
        try:
            payslip_uuid = uuid.UUID(payslip_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payslip ID format")
            
        payslip = db.query(Payslip).filter(Payslip.id == payslip_uuid, Payslip.tenant_id == tenant_id, Payslip.deleted_at == None).first()
        if not payslip:
            raise HTTPException(status_code=404, detail="Payslip not found")
            
        return serialize_payslip(payslip)

    @staticmethod
    def get_structures(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        structures = db.query(SalaryStructure).filter(SalaryStructure.tenant_id == tenant_id, SalaryStructure.deleted_at == None).all()
        res_data = []
        for ss in structures:
            comps_serialized = []
            for c in ss.components:
                comps_serialized.append({
                    "code": c.code,
                    "name": c.name,
                    "type": c.type,
                    "calcType": c.calc_type,
                    "value": c.value,
                    "isTaxable": c.is_taxable,
                    "isStatutory": c.is_statutory,
                    "displayOrder": c.display_order
                })
            res_data.append({
                "_id": str(ss.id),
                "name": ss.name,
                "components": comps_serialized
            })
        return res_data

    @staticmethod
    def create_structure(db: Session, payload: SalaryStructureCreateSchema, tenant_id: uuid.UUID) -> dict:
        ss = SalaryStructure(tenant_id=tenant_id, name=payload.name)
        db.add(ss)
        db.flush()
        
        for c in payload.components:
            comp = SalaryStructureComponent(
                structure_id=ss.id,
                code=c.code,
                name=c.name,
                type=c.type,
                calc_type=c.calc_type,
                value=c.value,
                is_taxable=c.is_taxable,
                is_statutory=c.is_statutory,
                display_order=c.display_order
            )
            db.add(comp)
            
        db.commit()
        db.refresh(ss)
        return {"_id": str(ss.id), "name": ss.name}

    # Revisions / Employee Salary assignments
    @staticmethod
    def assign_salary(db: Session, payload: EmployeeSalaryAssignSchema, tenant_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        struct_uuid = uuid.UUID(payload.structureId) if payload.structureId else None
        pg_uuid = uuid.UUID(payload.payGroupId) if payload.payGroupId else None
        
        # Deactivate old salary assignments
        db.query(EmployeeSalary).filter(
            EmployeeSalary.employee_id == emp_uuid,
            EmployeeSalary.tenant_id == tenant_id
        ).update({"status": "inactive"})
        
        assignment = EmployeeSalary(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            structure_id=struct_uuid,
            pay_group_id=pg_uuid,
            ctc=payload.ctc,
            effective_date=datetime.strptime(payload.effectiveDate, "%Y-%m-%d"),
            status="active",
            revisions_json=[{
                "ctc": payload.ctc,
                "assignedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }]
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return {"_id": str(assignment.id), "ctc": assignment.ctc}

    # Calendars & Pay Groups
    @staticmethod
    def create_calendar(db: Session, payload: PayrollCalendarCreateSchema, tenant_id: uuid.UUID) -> dict:
        cal = PayrollCalendar(
            tenant_id=tenant_id,
            name=payload.name,
            frequency=payload.frequency,
            start_date=datetime.strptime(payload.start_date, "%Y-%m-%d"),
            end_date=datetime.strptime(payload.end_date, "%Y-%m-%d"),
            processing_date=payload.processing_date,
            disbursement_date=payload.disbursement_date
        )
        db.add(cal)
        db.commit()
        db.refresh(cal)
        return {"_id": str(cal.id), "name": cal.name}

    @staticmethod
    def list_calendars(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        cals = db.query(PayrollCalendar).filter(PayrollCalendar.tenant_id == tenant_id).all()
        return [{"_id": str(c.id), "name": c.name, "frequency": c.frequency} for c in cals]

    @staticmethod
    def create_pay_group(db: Session, payload: PayGroupCreateSchema, tenant_id: uuid.UUID) -> dict:
        cal_uuid = uuid.UUID(payload.calendar_id) if payload.calendar_id else None
        pg = PayGroup(
            tenant_id=tenant_id,
            name=payload.name,
            calendar_id=cal_uuid,
            description=payload.description
        )
        db.add(pg)
        db.commit()
        db.refresh(pg)
        return {"_id": str(pg.id), "name": pg.name}

    @staticmethod
    def list_pay_groups(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        pgs = db.query(PayGroup).filter(PayGroup.tenant_id == tenant_id).all()
        return [{"_id": str(p.id), "name": p.name, "description": p.description} for p in pgs]

    # Loans
    @staticmethod
    def create_loan(db: Session, payload: PayrollLoanCreateSchema, tenant_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        loan = PayrollLoan(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            principal_amount=payload.principalAmount,
            interest_rate=payload.interestRate,
            emi_amount=payload.emiAmount,
            installments=payload.installments,
            outstanding_balance=payload.principalAmount,
            reason=payload.reason,
            status="pending"
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return {"_id": str(loan.id), "principalAmount": loan.principal_amount, "status": loan.status}

    @staticmethod
    def list_loans(db: Session, employee_id: Optional[uuid.UUID], tenant_id: uuid.UUID) -> List[dict]:
        query = db.query(PayrollLoan).filter(PayrollLoan.tenant_id == tenant_id)
        if employee_id:
            query = query.filter(PayrollLoan.employee_id == employee_id)
        loans = query.all()
        return [{
            "id": str(l.id),
            "employeeName": l.employee.full_name if l.employee else "",
            "principalAmount": l.principal_amount,
            "emiAmount": l.emi_amount,
            "installments": l.installments,
            "paidInstallments": l.paid_installments,
            "outstandingBalance": l.outstanding_balance,
            "status": l.status,
            "reason": l.reason
        } for l in loans]

    @staticmethod
    def approve_loan(db: Session, loan_id: str, approve: bool, approver_email: str, tenant_id: uuid.UUID) -> dict:
        loan_uuid = uuid.UUID(loan_id)
        loan = db.query(PayrollLoan).filter(PayrollLoan.id == loan_uuid, PayrollLoan.tenant_id == tenant_id).first()
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        loan.status = "active" if approve else "rejected"
        loan.approved_by = approver_email
        db.commit()
        return {"id": str(loan.id), "status": loan.status}

    # Reimbursements
    @staticmethod
    def create_reimbursement(db: Session, payload: PayrollReimbursementCreateSchema, employee_id: uuid.UUID, tenant_id: uuid.UUID) -> dict:
        reimb = PayrollReimbursement(
            tenant_id=tenant_id,
            employee_id=employee_id,
            category=payload.category,
            amount=payload.amount,
            reason=payload.reason,
            receipt_url=payload.receiptUrl,
            status="pending"
        )
        db.add(reimb)
        db.commit()
        db.refresh(reimb)
        return {"_id": str(reimb.id), "amount": reimb.amount, "status": reimb.status}

    @staticmethod
    def list_reimbursements(db: Session, employee_id: Optional[uuid.UUID], tenant_id: uuid.UUID) -> List[dict]:
        query = db.query(PayrollReimbursement).filter(PayrollReimbursement.tenant_id == tenant_id)
        if employee_id:
            query = query.filter(PayrollReimbursement.employee_id == employee_id)
        reimbs = query.all()
        return [{
            "id": str(r.id),
            "employeeName": r.employee.full_name if r.employee else "",
            "category": r.category,
            "amount": r.amount,
            "reason": r.reason,
            "status": r.status,
            "claimDate": r.claim_date.strftime("%Y-%m-%d")
        } for r in reimbs]

    @staticmethod
    def approve_reimbursement(db: Session, reimb_id: str, approve: bool, approver_email: str, tenant_id: uuid.UUID) -> dict:
        reimb_uuid = uuid.UUID(reimb_id)
        reimb = db.query(PayrollReimbursement).filter(PayrollReimbursement.id == reimb_uuid, PayrollReimbursement.tenant_id == tenant_id).first()
        if not reimb:
            raise HTTPException(status_code=404, detail="Reimbursement claim not found")
        reimb.status = "approved" if approve else "rejected"
        reimb.approved_by = approver_email
        db.commit()
        return {"id": str(reimb.id), "status": reimb.status}

    # Adjustments
    @staticmethod
    def create_adjustment(db: Session, payload: PayrollAdjustmentCreateSchema, tenant_id: uuid.UUID) -> dict:
        emp_uuid = uuid.UUID(payload.employeeId)
        adj = PayrollAdjustment(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            type=payload.type,
            amount=payload.amount,
            reason=payload.reason,
            is_processed=False
        )
        db.add(adj)
        db.commit()
        db.refresh(adj)
        return {"_id": str(adj.id), "amount": adj.amount}

    @staticmethod
    def list_adjustments(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        adjs = db.query(PayrollAdjustment).filter(PayrollAdjustment.tenant_id == tenant_id).all()
        return [{
            "id": str(a.id),
            "employeeName": a.employee.full_name if a.employee else "",
            "type": a.type,
            "amount": a.amount,
            "reason": a.reason,
            "isProcessed": a.is_processed
        } for a in adjs]

    # Ledgers
    @staticmethod
    def list_ledgers(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        ledgers = db.query(PayrollLedger).filter(PayrollLedger.tenant_id == tenant_id).all()
        return [{
            "id": str(l.id),
            "employeeName": l.employee.full_name if l.employee else "",
            "disbursedAmount": l.disbursed_amount,
            "status": l.status,
            "referenceNumber": l.reference_number,
            "disbursedAt": l.disbursed_at.strftime("%Y-%m-%d %H:%M:%S") if l.disbursed_at else None
        } for l in ledgers]

    @staticmethod
    def get_dashboard(db: Session, tenant_id: uuid.UUID) -> dict:
        from app.models.payroll import PayrollRun
        runs = db.query(PayrollRun).filter(PayrollRun.tenant_id == tenant_id).all()
        total_runs = len(runs)
        paid_runs = sum(1 for r in runs if r.status == "paid")
        total_payout = sum(r.total_net_pay for r in runs if r.status == "paid")
        return {
            "totalRuns": total_runs,
            "paidRuns": paid_runs,
            "totalPayout": round(total_payout, 2)
        }

    @staticmethod
    def get_analytics(db: Session, tenant_id: uuid.UUID) -> dict:
        from app.models.payroll import PayrollRun
        # Fetch monthly cost progression
        runs = db.query(PayrollRun).filter(
            PayrollRun.tenant_id == tenant_id,
            PayrollRun.status == "paid"
        ).order_by(PayrollRun.year.asc(), PayrollRun.month.asc()).all()
        
        chart_data = []
        for r in runs:
            chart_data.append({
                "period": f"{r.month}/{r.year}",
                "cost": r.total_gross
            })
        return {
            "costProgression": chart_data
        }
