"""create_database_views

Revision ID: c65a8f6c0cae
Revises: b708c3b27ea5
Create Date: 2026-07-10 12:39:33.229228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c65a8f6c0cae'
down_revision: Union[str, Sequence[str], None] = 'b708c3b27ea5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. vw_employee_directory
    op.execute("""
        CREATE VIEW vw_employee_directory AS
        SELECT id, tenant_id, employee_id, full_name, work_email, department_name, designation_name, status
        FROM employees
        WHERE deleted_at IS NULL;
    """)

    # 2. vw_attendance_summary
    op.execute("""
        CREATE VIEW vw_attendance_summary AS
        SELECT a.id, a.tenant_id, a.employee_id, e.employee_id AS emp_code, e.full_name, a.date, a.check_in, a.check_out, a.status, a.work_mode
        FROM attendance_records a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.deleted_at IS NULL AND e.deleted_at IS NULL;
    """)

    # 3. vw_leave_balance
    op.execute("""
        CREATE VIEW vw_leave_balance AS
        SELECT b.id, b.tenant_id, b.employee_id, e.full_name, t.name AS leave_type_name, t.code AS leave_type_code, b.year, b.allocated, b.used, b.pending, b.available
        FROM leave_balances b
        JOIN employees e ON b.employee_id = e.id
        JOIN leave_types t ON b.leave_type_id = t.id
        WHERE b.deleted_at IS NULL AND e.deleted_at IS NULL AND t.deleted_at IS NULL;
    """)

    # 4. vw_payroll_summary
    op.execute("""
        CREATE VIEW vw_payroll_summary AS
        SELECT r.id AS payroll_run_id, r.tenant_id, r.year, r.month, r.period, r.status AS run_status,
               COUNT(p.id) AS total_payslips,
               COALESCE(SUM(CAST(p.totals->>'gross' AS DOUBLE PRECISION)), 0.0) AS total_gross,
               COALESCE(SUM(CAST(p.totals->>'deductions' AS DOUBLE PRECISION)), 0.0) AS total_deductions,
               COALESCE(SUM(CAST(p.totals->>'net' AS DOUBLE PRECISION)), 0.0) AS total_net
        FROM payroll_runs r
        LEFT JOIN payslips p ON r.id = p.payroll_run_id AND p.deleted_at IS NULL
        WHERE r.deleted_at IS NULL
        GROUP BY r.id, r.tenant_id, r.year, r.month, r.period, r.status;
    """)

    # 5. vw_asset_assignment
    op.execute("""
        CREATE VIEW vw_asset_assignment AS
        SELECT aa.id, aa.tenant_id, aa.employee_id, e.full_name AS employee_name, a.id AS asset_id, a.name AS asset_name, a.category AS asset_type, a.serial_number, aa.assigned_at AS assigned_date, (CASE WHEN aa.status = 'returned' THEN aa.updated_at ELSE NULL END) AS returned_date, a.status AS asset_status
        FROM asset_assignments aa
        JOIN employees e ON aa.employee_id = e.id
        LEFT JOIN assets a ON aa.serial_number = a.serial_number AND aa.tenant_id = a.tenant_id AND a.deleted_at IS NULL
        WHERE aa.deleted_at IS NULL AND e.deleted_at IS NULL;
    """)

    # 6. vw_document_overview
    op.execute("""
        CREATE VIEW vw_document_overview AS
        SELECT d.id, d.tenant_id, d.employee_id, e.full_name AS employee_name, d.category, d.type, d.name, d.version, d.url, d.size, d.mime_type, d.expiry_date, d.is_expired, d.status
        FROM documents d
        LEFT JOIN employees e ON d.employee_id = e.id AND e.deleted_at IS NULL
        WHERE d.deleted_at IS NULL;
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_document_overview;")
    op.execute("DROP VIEW IF EXISTS vw_asset_assignment;")
    op.execute("DROP VIEW IF EXISTS vw_payroll_summary;")
    op.execute("DROP VIEW IF EXISTS vw_leave_balance;")
    op.execute("DROP VIEW IF EXISTS vw_attendance_summary;")
    op.execute("DROP VIEW IF EXISTS vw_employee_directory;")

