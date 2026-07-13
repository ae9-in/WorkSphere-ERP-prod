from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
import random
from datetime import datetime
from typing import Optional, Dict, Any

from app.repositories.employee import EmployeeRepository
from app.models.employee import (
    Employee, EmployeeEducation, EmployeeExperience, EmployeeEmergencyContact,
    EmployeeBankAccount, EmployeeSkill, EmployeeCertification, EmployeeTimeline
)
from app.models.user import User
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.employee import EmployeeCreateSchema, EmployeeUpdateSchema, JobSchema, SalarySchema
from app.services.timeline import TimelineService

employee_repo = EmployeeRepository()

def serialize_employee(emp: Employee) -> dict:
    return {
        "_id": str(emp.id),
        "employeeId": emp.employee_id,
        "fullName": emp.full_name,
        "companyId": str(emp.tenant_id),
        "personal": {
            "firstName": emp.first_name,
            "middleName": emp.middle_name,
            "lastName": emp.last_name,
            "displayName": emp.display_name,
            "dateOfBirth": emp.date_of_birth,
            "gender": emp.gender,
            "maritalStatus": emp.marital_status,
            "nationality": emp.nationality,
            "bloodGroup": emp.blood_group,
            "personalEmail": emp.personal_email,
            "personalPhone": emp.personal_phone,
            "photo": emp.photo,
        },
        "addressPermanent": {
            "line1": emp.perm_line1,
            "line2": emp.perm_line2,
            "city": emp.perm_city,
            "state": emp.perm_state,
            "country": emp.perm_country,
            "pincode": emp.perm_pincode,
        },
        "addressCurrent": {
            "line1": emp.curr_line1,
            "line2": emp.curr_line2,
            "city": emp.curr_city,
            "state": emp.curr_state,
            "country": emp.curr_country,
            "pincode": emp.curr_pincode,
        },
        "official": {
            "workEmail": emp.work_email,
            "workPhone": emp.work_phone,
            "employeeType": emp.employee_type,
            "dateOfJoining": emp.date_of_joining,
            "confirmationDate": emp.confirmation_date,
            "probationEndDate": emp.probation_end_date,
            "status": emp.status,
            "exitDate": emp.exit_date,
            "lastWorkingDay": emp.last_working_day,
        },
        "job": {
            "departmentId": emp.department_id,
            "departmentName": emp.department_name,
            "designationId": emp.designation_id,
            "designationName": emp.designation_name,
            "gradeId": emp.grade_id,
            "gradeName": emp.grade_name,
            "locationId": emp.location_id,
            "locationName": emp.location_name,
            "reportingManagerId": emp.reporting_manager_id,
            "reportingManagerName": emp.reporting_manager_name,
            "workMode": emp.work_mode,
            "shiftId": emp.shift_id,
            "shiftName": emp.shift_name,
            "costCenter": emp.cost_center,
        },
        "salary": {
            "ctc": emp.ctc,
            "basicPercent": emp.basic_percent,
            "currency": emp.currency,
            "effectiveDate": emp.salary_effective_date,
            "paymentMode": emp.payment_mode,
        },
        "education": [
            {
                "degree": edu.degree,
                "field": edu.field,
                "institution": edu.institution,
                "startYear": edu.start_year,
                "endYear": edu.end_year,
                "percentage": edu.percentage,
                "documentUrl": edu.document_url
            } for edu in (emp.education or [])
        ],
        "experience": [
            {
                "company": exp.company,
                "designation": exp.designation,
                "startDate": exp.start_date,
                "endDate": exp.end_date,
                "isCurrent": exp.is_current,
                "responsibilities": exp.responsibilities,
                "ctc": exp.ctc
            } for exp in (emp.experience or [])
        ],
        "emergencyContacts": [
            {
                "name": ec.name,
                "relationship": ec.relationship,
                "phone": ec.phone,
                "isPrimary": ec.is_primary
            } for ec in (emp.emergency_contacts or [])
        ],
        "bank": [
            {
                "id": str(bk.id),
                "bankName": bk.bank_name,
                "accountHolderName": bk.account_holder_name,
                "accountNumber": bk.account_number,
                "ifscSwiftCode": bk.ifsc_swift_code,
                "branchName": bk.branch_name,
                "accountType": bk.account_type,
                "upiId": bk.upi_id,
                "isPrimary": bk.is_primary
            } for bk in (emp.bank_accounts or [])
        ],
        "skills": [
            {
                "id": str(sk.id),
                "skillName": sk.skill_name,
                "skillType": sk.skill_type,
                "proficiencyLevel": sk.proficiency_level
            } for sk in (emp.skills or [])
        ],
        "certifications": [
            {
                "id": str(cert.id),
                "certificationName": cert.certification_name,
                "issuingAuthority": cert.issuing_authority,
                "issueDate": cert.issue_date,
                "expiryDate": cert.expiry_date,
                "credentialId": cert.credential_id,
                "credentialUrl": cert.credential_url
            } for cert in (emp.certifications or [])
        ]
    }

class EmployeeService:
    @staticmethod
    def list_employees(db: Session, tenant_id: uuid.UUID, search: str, status: str, page: int, limit: int) -> dict:
        data = employee_repo.search_employees(db, tenant_id, search, status, page, limit)
        return {
            "employees": [serialize_employee(emp) for emp in data["employees"]],
            "total": data["total"],
            "page": page,
            "totalPages": data["totalPages"]
        }

    @staticmethod
    def get_employee(db: Session, id_str: str, tenant_id: uuid.UUID, user_role: str, user_employee_id: Optional[uuid.UUID]) -> dict:
        try:
            emp_uuid = uuid.UUID(id_str)
            emp = employee_repo.get_by_id(db, emp_uuid)
        except ValueError:
            emp = employee_repo.get_by_employee_id(db, id_str, tenant_id)
            
        if not emp or emp.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        if user_role == "employee" and user_employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Forbidden. Access restricted to own profile.")
            
        return serialize_employee(emp)

    @staticmethod
    def create_employee(db: Session, payload: EmployeeCreateSchema, tenant_id: uuid.UUID, author_id: Optional[uuid.UUID]) -> dict:
        count = db.query(Employee).count()
        employee_id_str = f"EMP{str(count + 1).zfill(3)}"
        
        p = payload.personal
        o = payload.official
        j = payload.job or JobSchema()
        s = payload.salary or SalarySchema()
        ap = payload.addressPermanent
        ac = payload.addressCurrent

        emp = Employee(
            tenant_id=tenant_id,
            employee_id=employee_id_str,
            full_name=f"{p.firstName} {p.lastName}".strip(),
            first_name=p.firstName,
            middle_name=p.middleName,
            last_name=p.lastName,
            display_name=p.displayName or f"{p.firstName} {p.lastName}",
            date_of_birth=p.dateOfBirth,
            gender=p.gender,
            marital_status=p.maritalStatus,
            nationality=p.nationality or "Indian",
            blood_group=p.bloodGroup,
            personal_email=p.personalEmail,
            personal_phone=p.personalPhone,
            photo=p.photo,
            
            perm_line1=ap.line1 if ap else None,
            perm_line2=ap.line2 if ap else None,
            perm_city=ap.city if ap else None,
            perm_state=ap.state if ap else None,
            perm_country=ap.country if ap else "India",
            perm_pincode=ap.pincode if ap else None,
            
            curr_line1=ac.line1 if ac else None,
            curr_line2=ac.line2 if ac else None,
            curr_city=ac.city if ac else None,
            curr_state=ac.state if ac else None,
            curr_country=ac.country if ac else "India",
            curr_pincode=ac.pincode if ac else None,
            
            work_email=o.workEmail,
            work_phone=o.workPhone,
            employee_type=o.employeeType or "full_time",
            date_of_joining=o.dateOfJoining,
            confirmation_date=o.confirmationDate,
            probation_end_date=o.probationEndDate,
            status=o.status or "active",
            
            department_id=j.departmentId,
            department_name=j.departmentName,
            designation_id=j.designationId,
            designation_name=j.designationName,
            grade_id=j.gradeId,
            grade_name=j.gradeName,
            location_id=j.locationId,
            location_name=j.locationName,
            reporting_manager_id=j.reportingManagerId,
            reporting_manager_name=j.reportingManagerName,
            work_mode=j.workMode or "hybrid",
            shift_id=j.shiftId,
            shift_name=j.shiftName,
            cost_center=j.costCenter,
            
            ctc=s.ctc if s else 0.0,
            basic_percent=s.basicPercent if s else 40.0,
            currency=s.currency if s else "INR",
            salary_effective_date=s.effectiveDate,
            payment_mode=s.paymentMode if s else "bank_transfer"
        )
        
        db.add(emp)
        db.flush()

        # Save nested records
        if payload.education:
            for edu_in in payload.education:
                edu = EmployeeEducation(
                    employee_id=emp.id,
                    degree=edu_in.degree,
                    field=edu_in.field,
                    institution=edu_in.institution,
                    start_year=edu_in.startYear,
                    end_year=edu_in.endYear,
                    percentage=edu_in.percentage,
                    document_url=edu_in.documentUrl
                )
                db.add(edu)

        if payload.experience:
            for exp_in in payload.experience:
                exp = EmployeeExperience(
                    employee_id=emp.id,
                    company=exp_in.company,
                    designation=exp_in.designation,
                    start_date=exp_in.startDate,
                    end_date=exp_in.endDate,
                    is_current=exp_in.isCurrent,
                    responsibilities=exp_in.responsibilities,
                    ctc=exp_in.ctc
                )
                db.add(exp)

        if payload.emergencyContacts:
            for ec_in in payload.emergencyContacts:
                ec = EmployeeEmergencyContact(
                    employee_id=emp.id,
                    name=ec_in.name,
                    relationship=ec_in.relationship,
                    phone=ec_in.phone,
                    is_primary=ec_in.isPrimary
                )
                db.add(ec)

        if payload.bank:
            for bk_in in payload.bank:
                bk = EmployeeBankAccount(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    bank_name=bk_in.bankName,
                    account_holder_name=bk_in.accountHolderName,
                    account_number=bk_in.accountNumber,
                    ifsc_swift_code=bk_in.ifscSwiftCode,
                    branch_name=bk_in.branchName,
                    account_type=bk_in.accountType or "savings",
                    upi_id=bk_in.upiId,
                    is_primary=bk_in.isPrimary if bk_in.isPrimary is not None else True
                )
                db.add(bk)

        if payload.skills:
            for sk_in in payload.skills:
                sk = EmployeeSkill(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    skill_name=sk_in.skillName,
                    skill_type=sk_in.skillType or "technical",
                    proficiency_level=sk_in.proficiencyLevel
                )
                db.add(sk)

        if payload.certifications:
            for cert_in in payload.certifications:
                cert = EmployeeCertification(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    certification_name=cert_in.certificationName,
                    issuing_authority=cert_in.issuingAuthority,
                    issue_date=cert_in.issueDate,
                    expiry_date=cert_in.expiryDate,
                    credential_id=cert_in.credentialId,
                    credential_url=cert_in.credentialUrl
                )
                db.add(cert)

        # Log timeline event
        TimelineService.log_event(
            db=db,
            tenant_id=tenant_id,
            employee_id=emp.id,
            event_type="EMPLOYEE_CREATED",
            title="Employee Created",
            description=f"Employee profile created with ID {emp.employee_id}.",
            performed_by=str(author_id) if author_id else "system"
        )

        db.commit()
        db.refresh(emp)
        return serialize_employee(emp)

    @staticmethod
    def update_employee(db: Session, id_str: str, payload: EmployeeUpdateSchema, tenant_id: uuid.UUID, author_id: Optional[uuid.UUID]) -> dict:
        try:
            emp_uuid = uuid.UUID(id_str)
            emp = employee_repo.get_by_id(db, emp_uuid)
        except ValueError:
            emp = employee_repo.get_by_employee_id(db, id_str, tenant_id)
            
        if not emp or emp.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Employee not found")

        user_updates = {}

        p = payload.personal
        if p:
            if p.firstName is not None: emp.first_name = p.firstName
            if p.lastName is not None: emp.last_name = p.lastName
            if p.middleName is not None: emp.middle_name = p.middleName
            emp.full_name = f"{emp.first_name} {emp.last_name}".strip()
            user_updates["fullName"] = emp.full_name
            if p.displayName is not None: emp.display_name = p.displayName
            if p.dateOfBirth is not None: emp.date_of_birth = p.dateOfBirth
            if p.gender is not None: emp.gender = p.gender
            if p.maritalStatus is not None: emp.marital_status = p.maritalStatus
            if p.nationality is not None: emp.nationality = p.nationality
            if p.bloodGroup is not None: emp.blood_group = p.bloodGroup
            if p.personalEmail is not None: emp.personal_email = p.personalEmail
            if p.personalPhone is not None: emp.personal_phone = p.personalPhone
            if p.photo is not None:
                emp.photo = p.photo
                user_updates["photo"] = p.photo

        o = payload.official
        if o:
            if o.workEmail is not None:
                emp.work_email = o.workEmail
                user_updates["email"] = o.workEmail.lower()
            if o.workPhone is not None: emp.work_phone = o.workPhone
            if o.employeeType is not None: emp.employee_type = o.employeeType
            if o.dateOfJoining is not None: emp.date_of_joining = o.dateOfJoining
            if o.confirmationDate is not None: emp.confirmation_date = o.confirmationDate
            if o.probationEndDate is not None: emp.probation_end_date = o.probationEndDate
            if o.status is not None: emp.status = o.status
            if o.exitDate is not None: emp.exit_date = o.exitDate
            if o.lastWorkingDay is not None: emp.last_working_day = o.lastWorkingDay

        j = payload.job
        if j:
            if j.departmentId is not None: emp.department_id = j.departmentId
            if j.departmentName is not None: emp.department_name = j.departmentName
            if j.designationId is not None: emp.designation_id = j.designationId
            if j.designationName is not None: emp.designation_name = j.designationName
            if j.gradeId is not None: emp.grade_id = j.gradeId
            if j.gradeName is not None: emp.grade_name = j.gradeName
            if j.locationId is not None: emp.location_id = j.locationId
            if j.locationName is not None: emp.location_name = j.locationName
            if j.reportingManagerId is not None: emp.reporting_manager_id = j.reportingManagerId
            if j.reportingManagerName is not None: emp.reporting_manager_name = j.reportingManagerName
            if j.workMode is not None: emp.work_mode = j.workMode
            if j.shiftId is not None: emp.shift_id = j.shiftId
            if j.shiftName is not None: emp.shift_name = j.shiftName
            if j.costCenter is not None: emp.cost_center = j.costCenter

        s = payload.salary
        if s:
            if s.ctc is not None: emp.ctc = s.ctc
            if s.basicPercent is not None: emp.basic_percent = s.basicPercent
            if s.currency is not None: emp.currency = s.currency
            if s.effectiveDate is not None: emp.salary_effective_date = s.effectiveDate
            if s.paymentMode is not None: emp.payment_mode = s.paymentMode

        ap = payload.addressPermanent
        if ap:
            if ap.line1 is not None: emp.perm_line1 = ap.line1
            if ap.line2 is not None: emp.perm_line2 = ap.line2
            if ap.city is not None: emp.perm_city = ap.city
            if ap.state is not None: emp.perm_state = ap.state
            if ap.country is not None: emp.perm_country = ap.country
            if ap.pincode is not None: emp.perm_pincode = ap.pincode

        ac = payload.addressCurrent
        if ac:
            if ac.line1 is not None: emp.curr_line1 = ac.line1
            if ac.line2 is not None: emp.curr_line2 = ac.line2
            if ac.city is not None: emp.curr_city = ac.city
            if ac.state is not None: emp.curr_state = ac.state
            if ac.country is not None: emp.curr_country = ac.country
            if ac.pincode is not None: emp.curr_pincode = ac.pincode

        # Update nested records if provided in payload
        if payload.education is not None:
            db.query(EmployeeEducation).filter(EmployeeEducation.employee_id == emp.id).delete()
            for edu_in in payload.education:
                edu = EmployeeEducation(
                    employee_id=emp.id,
                    degree=edu_in.degree,
                    field=edu_in.field,
                    institution=edu_in.institution,
                    start_year=edu_in.startYear,
                    end_year=edu_in.endYear,
                    percentage=edu_in.percentage,
                    document_url=edu_in.documentUrl
                )
                db.add(edu)

        if payload.experience is not None:
            db.query(EmployeeExperience).filter(EmployeeExperience.employee_id == emp.id).delete()
            for exp_in in payload.experience:
                exp = EmployeeExperience(
                    employee_id=emp.id,
                    company=exp_in.company,
                    designation=exp_in.designation,
                    start_date=exp_in.startDate,
                    end_date=exp_in.endDate,
                    is_current=exp_in.isCurrent,
                    responsibilities=exp_in.responsibilities,
                    ctc=exp_in.ctc
                )
                db.add(exp)

        if payload.emergencyContacts is not None:
            db.query(EmployeeEmergencyContact).filter(EmployeeEmergencyContact.employee_id == emp.id).delete()
            for ec_in in payload.emergencyContacts:
                ec = EmployeeEmergencyContact(
                    employee_id=emp.id,
                    name=ec_in.name,
                    relationship=ec_in.relationship,
                    phone=ec_in.phone,
                    is_primary=ec_in.isPrimary
                )
                db.add(ec)

        if payload.bank is not None:
            db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == emp.id).delete()
            for bk_in in payload.bank:
                bk = EmployeeBankAccount(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    bank_name=bk_in.bankName,
                    account_holder_name=bk_in.accountHolderName,
                    account_number=bk_in.accountNumber,
                    ifsc_swift_code=bk_in.ifscSwiftCode,
                    branch_name=bk_in.branchName,
                    account_type=bk_in.accountType or "savings",
                    upi_id=bk_in.upiId,
                    is_primary=bk_in.isPrimary if bk_in.isPrimary is not None else True
                )
                db.add(bk)

        if payload.skills is not None:
            db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp.id).delete()
            for sk_in in payload.skills:
                sk = EmployeeSkill(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    skill_name=sk_in.skillName,
                    skill_type=sk_in.skillType or "technical",
                    proficiency_level=sk_in.proficiencyLevel
                )
                db.add(sk)

        if payload.certifications is not None:
            db.query(EmployeeCertification).filter(EmployeeCertification.employee_id == emp.id).delete()
            for cert_in in payload.certifications:
                cert = EmployeeCertification(
                    tenant_id=tenant_id,
                    employee_id=emp.id,
                    certification_name=cert_in.certificationName,
                    issuing_authority=cert_in.issuingAuthority,
                    issue_date=cert_in.issueDate,
                    expiry_date=cert_in.expiryDate,
                    credential_id=cert_in.credentialId,
                    credential_url=cert_in.credentialUrl
                )
                db.add(cert)

        # Log timeline event
        TimelineService.log_event(
            db=db,
            tenant_id=tenant_id,
            employee_id=emp.id,
            event_type="PROFILE_UPDATED",
            title="Profile Updated",
            description="Employee personal or professional details were updated.",
            performed_by=str(author_id) if author_id else "system"
        )

        db.add(emp)
        db.commit()
        db.refresh(emp)

        # Sync User profile
        if user_updates:
            target_user = db.query(User).filter(User.employee_id == emp.id, User.company_id == tenant_id).first()
            if target_user:
                if "fullName" in user_updates: target_user.full_name = user_updates["fullName"]
                if "email" in user_updates: target_user.email = user_updates["email"]
                if "photo" in user_updates: target_user.photo = user_updates["photo"]
                db.commit()

        return serialize_employee(emp)

    @staticmethod
    def delete_employee(db: Session, id_str: str, tenant_id: uuid.UUID, author_id: Optional[uuid.UUID]) -> bool:
        try:
            emp_uuid = uuid.UUID(id_str)
            emp = employee_repo.get_by_id(db, emp_uuid)
        except ValueError:
            emp = employee_repo.get_by_employee_id(db, id_str, tenant_id)
            
        if not emp or emp.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Employee not found")

        return employee_repo.remove(db, emp.id, author_id)

    @staticmethod
    def dispatch_action(db: Session, id_str: str, action: str, data: dict, user: User, tenant_id: uuid.UUID) -> dict:
        action = action.upper()
        is_super_admin = user.role == "super_admin"
        is_company_hr = user.role in ["company_admin", "hr_head"]
        is_manager = user.role in ["reporting_manager", "manager"]
        
        manager_allowed = [
            "VIEW_ATTENDANCE", "REGULARIZE_ATTENDANCE", "ASSIGN_SHIFT",
            "VIEW_LEAVE", "APPROVE_LEAVE", "ASSIGN_LEAVE_POLICY",
            "SEND_EMAIL", "SCHEDULE_MEETING"
        ]
        
        if is_manager and action not in manager_allowed:
            raise HTTPException(status_code=403, detail="Access denied. Managers cannot perform corporate profile modifications.")
            
        if not is_super_admin and not is_company_hr and not is_manager:
            raise HTTPException(status_code=403, detail="Access denied. You do not have permissions for employee actions.")
            
        if action == "DELETE" and not is_super_admin:
            raise HTTPException(status_code=403, detail="Access denied. Only Platform Super Admins can delete employee profiles.")

        # Get Employee
        try:
            emp_uuid = uuid.UUID(id_str)
            emp = db.query(Employee).filter(Employee.id == emp_uuid, Employee.tenant_id == tenant_id, Employee.deleted_at == None).first()
        except ValueError:
            emp = db.query(Employee).filter(Employee.employee_id == id_str, Employee.tenant_id == tenant_id, Employee.deleted_at == None).first()
            
        if not emp:
            raise HTTPException(status_code=404, detail="Employee record not found.")

        audit_details = ""
        
        if action == "PROMOTE":
            if not data.get("designationName") or not data.get("ctc"):
                raise HTTPException(status_code=400, detail="New Designation and CTC Salary are required.")
            emp.designation_name = data.get("designationName")
            emp.ctc = float(data.get("ctc"))
            emp.salary_effective_date = datetime.utcnow().strftime("%Y-%m-%d")
            audit_details = f"Promoted to {emp.designation_name} with revised CTC Rs.{emp.ctc:,.2f}"
            
        elif action == "TRANSFER":
            if not data.get("departmentName"):
                raise HTTPException(status_code=400, detail="New Department Name is required.")
            old_dept = emp.department_name
            emp.department_name = data.get("departmentName")
            audit_details = f"Transferred from {old_dept} to {emp.department_name}"
            
        elif action == "CHANGE_DESIGNATION":
            if not data.get("designationName"):
                raise HTTPException(status_code=400, detail="Designation name is required.")
            emp.designation_name = data.get("designationName")
            audit_details = f"Designation updated to {emp.designation_name}"
            
        elif action == "CHANGE_REPORTING_MANAGER":
            if not data.get("reportingManagerName"):
                raise HTTPException(status_code=400, detail="Reporting manager name is required.")
            emp.reporting_manager_name = data.get("reportingManagerName")
            audit_details = f"Reporting supervisor reassigned to {emp.reporting_manager_name}"
            
        elif action == "CONVERT_EMPLOYMENT_TYPE":
            if not data.get("employeeType"):
                raise HTTPException(status_code=400, detail="Employment type is required.")
            emp.employee_type = data.get("employeeType")
            audit_details = f"Employment type converted to {emp.employee_type}"
            
        elif action == "EXTEND_PROBATION":
            if not data.get("probationEndDate"):
                raise HTTPException(status_code=400, detail="Probation extension end date is required.")
            emp.probation_end_date = data.get("probationEndDate")
            emp.status = "probation"
            audit_details = f"Probation extended until {emp.probation_end_date}"
            
        elif action == "CONFIRM_EMPLOYMENT":
            emp.status = "active"
            emp.confirmation_date = datetime.utcnow().strftime("%Y-%m-%d")
            audit_details = "Employment status confirmed as active permanent."
            
        elif action == "MARK_RESIGNED":
            if not data.get("lastWorkingDay"):
                raise HTTPException(status_code=400, detail="Last working day is required.")
            emp.status = "resigned"
            emp.last_working_day = data.get("lastWorkingDay")
            audit_details = f"Marked resigned. Exit notice set for LWD: {emp.last_working_day}"
            
        elif action == "INITIATE_OFFBOARDING":
            if not data.get("lastWorkingDay"):
                raise HTTPException(status_code=400, detail="Last working day is required.")
            emp.status = "notice_period"
            emp.last_working_day = data.get("lastWorkingDay")
            audit_details = f"Notice period initiated. LWD: {emp.last_working_day}"
            
        elif action == "TERMINATE":
            emp.status = "terminated"
            emp.exit_date = datetime.utcnow().strftime("%Y-%m-%d")
            target_user = db.query(User).filter(User.employee_id == emp.id, User.company_id == tenant_id).first()
            if target_user:
                target_user.is_active = False
            audit_details = "Terminated corporate session. Account logins revoked."
            
        elif action == "DELETE":
            # Soft delete User
            target_user = db.query(User).filter(User.employee_id == emp.id, User.company_id == tenant_id).first()
            if target_user:
                target_user.deleted_at = datetime.utcnow()
                target_user.is_active = False
            
            # Soft delete Employee
            emp.deleted_at = datetime.utcnow()
            db.commit()
            
            # Log audit
            audit = AuditLog(
                tenant_id=tenant_id,
                user_id=user.id,
                email=user.email,
                action="EMPLOYEE_DELETE",
                details=f"Admin {user.email} soft deleted employee {emp.full_name} ({emp.employee_id})"
            )
            db.add(audit)
            db.commit()
            return {"success": True, "message": "Soft removed employee record and associated portal login."}
            
        elif action == "RESET_PASSWORD":
            target_user = db.query(User).filter(User.employee_id == emp.id, User.company_id == tenant_id).first()
            if not target_user:
                raise HTTPException(status_code=404, detail="Portal login not found for this employee.")
            temp_pwd = f"Reset@{emp.employee_id}"
            from app.core.security import get_password_hash
            target_user.password_hash = get_password_hash(temp_pwd)
            audit_details = "Generated new temporary credentials password."
            
        elif action == "DISABLE_LOGIN":
            target_user = db.query(User).filter(User.employee_id == emp.id, User.company_id == tenant_id).first()
            if target_user:
                target_user.is_active = False
            audit_details = "Revoked system login session permissions."
            
        elif action == "ACTIVATE_LOGIN":
            target_user = db.query(User).filter(User.employee_id == emp.id, User.company_id == tenant_id).first()
            if target_user:
                target_user.is_active = True
            audit_details = "Re-activated credentials login profile access."
            
        elif action == "ASSIGN_ASSET":
            if not data.get("assetType") or not data.get("assetName"):
                raise HTTPException(status_code=400, detail="Asset Type and Name are required.")
                
            from app.models.asset import Asset, AssetAssignment
            # Check if asset exists, or create mock
            asset = Asset(
                tenant_id=tenant_id,
                name=data.get("assetName"),
                type=data.get("assetType"),
                serial_number=data.get("serialNumber") or f"SN-{random.randint(100000, 999999)}",
                status="assigned"
            )
            db.add(asset)
            db.flush()
            
            assignment = AssetAssignment(
                tenant_id=tenant_id,
                asset_id=asset.id,
                employee_id=emp.id,
                assigned_date=datetime.utcnow()
            )
            db.add(assignment)
            audit_details = f"Allocated new asset: {asset.name} ({asset.type})"
            
        elif action == "RETURN_ASSET":
            if not data.get("assetName"):
                raise HTTPException(status_code=400, detail="Asset name is required.")
                
            from app.models.asset import Asset, AssetAssignment
            # Find assignment
            assignment = db.query(AssetAssignment).join(Asset).filter(
                AssetAssignment.employee_id == emp.id,
                AssetAssignment.tenant_id == tenant_id,
                Asset.name == data.get("assetName"),
                AssetAssignment.returned_date == None
            ).first()
            if assignment:
                assignment.returned_date = datetime.utcnow()
                assignment.asset.status = "available"
            audit_details = f"Deallocated and returned asset: {data.get('assetName')}"
            
        elif action == "REVISE_SALARY":
            if not data.get("ctc"):
                raise HTTPException(status_code=400, detail="CTC value is required.")
            emp.ctc = float(data.get("ctc"))
            audit_details = f"Revised annual compensation CTC packages to Rs.{emp.ctc:,.2f}"
            
        else:
            audit_details = f"Executed corporate workflow action: {action.replace('_', ' ')}"
            
        db.commit()
        db.refresh(emp)

        # Log timeline event
        TimelineService.log_event(
            db=db,
            tenant_id=tenant_id,
            employee_id=emp.id,
            event_type=f"ACTION_{action}",
            title=f"Employee Action: {action.replace('_', ' ').title()}",
            description=audit_details,
            performed_by=user.email,
            metadata_json={"action": action, "data": data}
        )
        
        # Generate Audit Logs & Notifications
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=user.id,
            email=user.email,
            action=f"EMPLOYEE_{action}",
            details=f"Admin {user.email} performed action [{action}] on employee {emp.full_name} ({emp.employee_id}). Details: {audit_details}"
        )
        db.add(audit)
        
        notification = Notification(
            tenant_id=tenant_id,
            type="approval_request",
            title=f"Employee Action: {action.replace('_', ' ')}",
            message=f"Action executed on {emp.full_name}: {audit_details}",
            read=False,
            url=f"/employees/{emp.employee_id}",
            actor={"name": user.email}
        )
        db.add(notification)
        db.commit()
        
        return serialize_employee(emp)
