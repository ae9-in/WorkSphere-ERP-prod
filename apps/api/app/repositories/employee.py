from app.repositories.base import BaseRepository
from app.models.employee import Employee
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List, Dict, Any

class EmployeeRepository(BaseRepository[Employee]):
    def __init__(self):
        super().__init__(Employee)

    def get_by_employee_id(self, db: Session, employee_id: str, tenant_id: UUID) -> Optional[Employee]:
        return db.query(Employee).filter(
            Employee.employee_id == employee_id,
            Employee.tenant_id == tenant_id,
            Employee.deleted_at == None
        ).first()

    def search_employees(self, db: Session, tenant_id: UUID, search: str, status: str, page: int, limit: int) -> Dict[str, Any]:
        query = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.deleted_at == None)
        
        if status and status != "all":
            query = query.filter(Employee.status == status)
            
        if search:
            search_pattern = f"%{search.lower()}%"
            query = query.filter(
                (Employee.full_name.ilike(search_pattern)) |
                (Employee.employee_id.ilike(search_pattern)) |
                (Employee.personal_email.ilike(search_pattern)) |
                (Employee.department_name.ilike(search_pattern))
            )
            
        total = query.count()
        offset = (page - 1) * limit
        employees = query.order_by(Employee.full_name).offset(offset).limit(limit).all()
        
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        return {
            "employees": employees,
            "total": total,
            "totalPages": total_pages
        }
