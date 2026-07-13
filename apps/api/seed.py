import os
import sys
import uuid
from datetime import datetime

# Add root folder to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, verify_db_connectivity
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User
from app.api.settings import seed_defaults_if_empty, get_or_create_company_settings
from app.models.leave import LeaveType
from app.models.payroll import SalaryStructure, SalaryStructureComponent
from app.models.workflow import WorkflowDefinition, WorkflowDefinitionStep

def seed_database():
    print("[Seed] Running database startup connection check...")
    try:
        verify_db_connectivity()
        print("[Seed] [OK] Database is reachable")
    except Exception as exc:
        print(f"[Seed] [FAIL] Database connection failed: {exc}")
        sys.exit(1)

    db = SessionLocal()
    try:
        print("[Seed] Checking if default company already exists...")
        # 1. Seed Company
        company = db.query(Company).filter(Company.slug == "worksphere").first()
        if not company:
            company = Company(
                name="WorkSphere Technologies",
                slug="worksphere",
                status="active",
                industry="Technology",
                size="10000+",
                country="India",
                subscription_plan="enterprise",
                subscription_status="active"
            )
            db.add(company)
            db.flush()  # populate ID
            print(f"[Seed] Created default company: {company.name} ({company.id})")
        else:
            print(f"[Seed] Default company already exists: {company.name} ({company.id})")

        # 2. Seed Employee Profile
        employee = db.query(Employee).filter(Employee.work_email == "admin@worksphere.com").first()
        if not employee:
            employee = Employee(
                tenant_id=company.id,
                employee_id="EMP-00001",
                full_name="System Admin",
                first_name="System",
                last_name="Admin",
                work_email="admin@worksphere.com",
                date_of_joining="2026-01-01",
                employee_type="full_time",
                status="active",
                work_mode="onsite"
            )
            db.add(employee)
            db.flush()
            print(f"[Seed] Created default Employee profile: {employee.full_name}")
        else:
            print(f"[Seed] Default Employee profile already exists: {employee.full_name}")

        # 3. Seed Super Admin User
        user = db.query(User).filter(User.email == "admin@worksphere.com").first()
        if not user:
            user = User(
                email="admin@worksphere.com",
                password_hash=get_password_hash("Admin@123"),
                full_name="System Admin",
                role="admin",
                permissions=[],
                company_id=company.id,
                employee_id=employee.id,
                is_active=True
            )
            db.add(user)
            db.flush()
            print(f"[Seed] Created Super Admin User: {user.email}")
        else:
            # Sync user's employee_id and company_id if needed
            user.company_id = company.id
            user.employee_id = employee.id
            print(f"[Seed] Super Admin User already exists: {user.email}")

        # 4. Seed Company Settings
        get_or_create_company_settings(db, company.id)
        
        # 5. Seed default departments, designations, employment types, branches
        seed_defaults_if_empty(db, company.id)
        print("[Seed] Seeded default departments, designations, branches")

        # 6. Seed Leave Types
        leave_types = [
            {"name": "Annual Leave", "code": "AL", "is_paid": True, "accrual_based": True, "max_days": 15, "carry_forward": True, "requires_approval": True},
            {"name": "Sick Leave", "code": "SL", "is_paid": True, "accrual_based": False, "max_days": 7, "carry_forward": False, "requires_approval": True},
            {"name": "Casual Leave", "code": "CL", "is_paid": True, "accrual_based": False, "max_days": 7, "carry_forward": False, "requires_approval": True},
            {"name": "Maternity Leave", "code": "ML", "is_paid": True, "accrual_based": False, "max_days": 90, "carry_forward": False, "gender": "female", "requires_approval": True},
            {"name": "Paternity Leave", "code": "PL", "is_paid": True, "accrual_based": False, "max_days": 10, "carry_forward": False, "gender": "male", "requires_approval": True},
            {"name": "Loss Of Pay", "code": "LOP", "is_paid": False, "accrual_based": False, "max_days": 365, "carry_forward": False, "requires_approval": True}
        ]
        for lt in leave_types:
            existing = db.query(LeaveType).filter(LeaveType.tenant_id == company.id, LeaveType.code == lt["code"]).first()
            if not existing:
                new_lt = LeaveType(tenant_id=company.id, **lt)
                db.add(new_lt)
        print("[Seed] Seeded default Leave Types")

        # 7. Seed Default Salary Structure
        existing_ss = db.query(SalaryStructure).filter(SalaryStructure.tenant_id == company.id, SalaryStructure.name == "Default Structure").first()
        if not existing_ss:
            ss = SalaryStructure(tenant_id=company.id, name="Default Structure")
            db.add(ss)
            db.flush()
            
            components = [
                {"code": "BASIC", "name": "Basic Salary", "type": "earning", "calc_type": "pct_ctc", "value": 40.0, "is_taxable": True, "is_statutory": False, "display_order": 1},
                {"code": "HRA", "name": "House Rent Allowance", "type": "earning", "calc_type": "pct_basic", "value": 50.0, "is_taxable": True, "is_statutory": False, "display_order": 2},
                {"code": "SPECIAL", "name": "Special Allowance", "type": "earning", "calc_type": "formula", "value": 0.0, "is_taxable": True, "is_statutory": False, "display_order": 3},
                {"code": "PF_EMP", "name": "Provident Fund (Employee)", "type": "deduction", "calc_type": "fixed", "value": 1800.0, "is_taxable": False, "is_statutory": True, "display_order": 4}
            ]
            for comp in components:
                c = SalaryStructureComponent(structure_id=ss.id, **comp)
                db.add(c)
        print("[Seed] Seeded default Salary Structure")

        # 8. Seed Default Workflow Definitions
        existing_wf = db.query(WorkflowDefinition).filter(WorkflowDefinition.tenant_id == company.id, WorkflowDefinition.module == "leave").first()
        if not existing_wf:
            wf = WorkflowDefinition(tenant_id=company.id, module="leave", trigger="submitted", is_active=True)
            db.add(wf)
            db.flush()
            
            step = WorkflowDefinitionStep(definition_id=wf.id, step_no=1, approver_type="reporting_manager", sla_hours=48, can_delegate=True)
            db.add(step)
        print("[Seed] Seeded default Workflow Definitions")

        db.commit()
        print("[Seed] [OK] Database seeding completed successfully and idempotently!")

    except Exception as exc:
        db.rollback()
        print(f"[Seed] [FAIL] Database seeding failed: {exc}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
