from app.repositories.base import BaseRepository
from app.models.payroll import PayrollRun, Payslip, SalaryStructure
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class PayrollRepository(BaseRepository[PayrollRun]):
    def __init__(self):
        super().__init__(PayrollRun)

    def get_runs(self, db: Session, tenant_id: UUID) -> List[PayrollRun]:
        return db.query(PayrollRun).filter(
            PayrollRun.tenant_id == tenant_id,
            PayrollRun.deleted_at == None
        ).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).all()

    def get_run_by_period(self, db: Session, tenant_id: UUID, month: int, year: int) -> Optional[PayrollRun]:
        return db.query(PayrollRun).filter(
            PayrollRun.tenant_id == tenant_id,
            PayrollRun.month == month,
            PayrollRun.year == year,
            PayrollRun.deleted_at == None
        ).first()

    def get_payslips_for_run(self, db: Session, run_id: UUID) -> List[Payslip]:
        return db.query(Payslip).filter(
            Payslip.payroll_run_id == run_id,
            Payslip.deleted_at == None
        ).all()

    def get_payslip_by_id(self, db: Session, payslip_id: UUID, tenant_id: UUID) -> Optional[Payslip]:
        return db.query(Payslip).filter(
            Payslip.id == payslip_id,
            Payslip.tenant_id == tenant_id,
            Payslip.deleted_at == None
        ).first()

    def get_structures(self, db: Session, tenant_id: UUID) -> List[SalaryStructure]:
        return db.query(SalaryStructure).filter(
            SalaryStructure.tenant_id == tenant_id,
            SalaryStructure.deleted_at == None
        ).all()
