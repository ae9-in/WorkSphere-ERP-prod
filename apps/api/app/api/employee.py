from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreateSchema, EmployeeUpdateSchema, EmployeeActionSchema
from app.services.employee import EmployeeService
from app.services.document import DocumentUploadRequest
import uuid

router = APIRouter(prefix="/employees", tags=["employees"])

@router.get("")
def list_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    status: str = Query("all"),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = EmployeeService.list_employees(
        db, tenant_id=tenant_id, search=search, status=status, page=page, limit=limit
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/{id}")
def get_employee(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = EmployeeService.get_employee(
        db, 
        id_str=id, 
        tenant_id=tenant_id, 
        user_role=user.role, 
        user_employee_id=user.employee_id
    )
    return {
        "success": True,
        "data": result
    }

@router.post("")
def create_employee(payload: EmployeeCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = EmployeeService.create_employee(
        db, payload=payload, tenant_id=tenant_id, author_id=user.id
    )
    return {
        "success": True,
        "data": result
    }

@router.patch("/{id}")
def update_employee(id: str, payload: EmployeeUpdateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = EmployeeService.update_employee(
        db, id_str=id, payload=payload, tenant_id=tenant_id, author_id=user.id
    )
    return {
        "success": True,
        "data": result
    }

@router.delete("/{id}")
def delete_employee(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    success = EmployeeService.delete_employee(
        db, id_str=id, tenant_id=tenant_id, author_id=user.id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return {
        "success": True,
        "message": "Employee soft deleted successfully"
    }

@router.post("/{id}/actions")
def dispatch_action(id: str, payload: EmployeeActionSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = EmployeeService.dispatch_action(
        db, id_str=id, action=payload.action, data=payload.data or {}, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result,
        "message": f"Action '{payload.action}' completed successfully."
    }

@router.get("/{id}/timeline")
def get_employee_timeline(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    try:
        emp_uuid = uuid.UUID(id)
        emp = db.query(Employee).filter(Employee.id == emp_uuid, Employee.tenant_id == tenant_id, Employee.deleted_at == None).first()
    except ValueError:
        emp = db.query(Employee).filter(Employee.employee_id == id, Employee.tenant_id == tenant_id, Employee.deleted_at == None).first()
        
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    from app.services.timeline import TimelineService
    events = TimelineService.get_timeline(db, employee_id=emp.id, tenant_id=tenant_id)
    
    events_serialized = []
    for ev in events:
        events_serialized.append({
            "id": str(ev.id),
            "eventType": ev.event_type,
            "title": ev.title,
            "description": ev.description,
            "eventDate": ev.event_date.strftime("%Y-%m-%d %H:%M:%S") if ev.event_date else None,
            "performedBy": ev.performed_by,
            "metadataJson": ev.metadata_json
        })
        
    return {
        "success": True,
        "data": events_serialized
    }

@router.post("/{id}/transfer")
def transfer_employee(id: str, payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = EmployeeService.dispatch_action(
        db, id_str=id, action="TRANSFER", data=payload, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result,
        "message": "Employee transferred successfully."
    }

@router.post("/{id}/promote")
def promote_employee(id: str, payload: dict, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = EmployeeService.dispatch_action(
        db, id_str=id, action="PROMOTE", data=payload, user=user, tenant_id=tenant_id
    )
    return {
        "success": True,
        "data": result,
        "message": "Employee promoted successfully."
    }

@router.post("/{id}/documents", status_code=status.HTTP_201_CREATED)
def upload_employee_document(
    id: str,
    payload: DocumentUploadRequest,
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    try:
        emp_uuid = uuid.UUID(id)
        emp = db.query(Employee).filter(Employee.id == emp_uuid, Employee.tenant_id == tenant_id, Employee.deleted_at == None).first()
    except ValueError:
        emp = db.query(Employee).filter(Employee.employee_id == id, Employee.tenant_id == tenant_id, Employee.deleted_at == None).first()
        
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    payload.employeeId = str(emp.id)
    from app.services.document import DocumentService
    result = DocumentService.upload_document(
        db, payload=payload, tenant_id=tenant_id, author_id=user.id, author_email=user.email
    )
    return {
        "success": True,
        "data": result
    }
