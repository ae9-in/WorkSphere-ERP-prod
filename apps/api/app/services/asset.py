from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from sqlalchemy import func
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.asset import AssetRepository
from app.repositories.employee import EmployeeRepository
from app.models.asset import Asset, AssetAssignment
from app.models.employee import Employee
from app.models.audit import AuditLog
from app.schemas.asset import AssetCreateSchema, AssetAssignSchema, AssetReturnSchema

asset_repo = AssetRepository()
employee_repo = EmployeeRepository()

def serialize_asset(asset: Asset) -> dict:
    return {
        "_id": str(asset.id),
        "category": asset.category,
        "name": asset.name,
        "assetTag": asset.asset_tag,
        "serialNumber": asset.serial_number,
        "brand": asset.brand,
        "modelName": asset.model_name,
        "purchaseDate": asset.purchase_date.strftime("%Y-%m-%d") if asset.purchase_date else None,
        "purchasePrice": asset.purchase_price,
        "warrantyExpiry": asset.warranty_expiry.strftime("%Y-%m-%d") if asset.warranty_expiry else None,
        "status": asset.status,
        "currentEmployeeId": str(asset.current_employee_id) if asset.current_employee_id else None,
        "assignedAt": asset.assigned_at.strftime("%Y-%m-%d %H:%M:%S") if asset.assigned_at else None,
        "returnedAt": asset.returned_at.strftime("%Y-%m-%d %H:%M:%S") if asset.returned_at else None,
        "condition": asset.condition,
        "notes": asset.notes,
        "companyId": str(asset.tenant_id)
    }

class AssetService:
    @staticmethod
    def create_asset(db: Session, payload: AssetCreateSchema, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        p_date = None
        if payload.purchaseDate:
            p_date = datetime.strptime(payload.purchaseDate, "%Y-%m-%d")
            
        w_expiry = None
        if payload.warrantyExpiry:
            w_expiry = datetime.strptime(payload.warrantyExpiry, "%Y-%m-%d")
            
        asset = Asset(
            tenant_id=tenant_id,
            category=payload.category,
            name=payload.name,
            asset_tag=payload.assetTag,
            serial_number=payload.serialNumber,
            brand=payload.brand,
            model_name=payload.modelName,
            purchase_date=p_date,
            purchase_price=payload.purchasePrice,
            warranty_expiry=w_expiry,
            status=payload.status or "available",
            condition=payload.condition or "new",
            notes=payload.notes
        )
        db.add(asset)
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="ASSET_CREATED",
            details=f"Created asset tag {payload.assetTag}"
        )
        db.add(audit)
        db.commit()
        db.refresh(asset)
        return serialize_asset(asset)

    @staticmethod
    def list_assets(db: Session, tenant_id: uuid.UUID, status: Optional[str], category: Optional[str], employee_id_str: Optional[str]) -> List[dict]:
        query = db.query(Asset).filter(Asset.tenant_id == tenant_id, Asset.deleted_at == None)
        
        if status:
            query = query.filter(Asset.status == status)
        if category:
            query = query.filter(Asset.category == category)
        if employee_id_str:
            try:
                emp_uuid = uuid.UUID(employee_id_str)
                query = query.filter(Asset.current_employee_id == emp_uuid)
            except ValueError:
                query = query.join(Employee, Employee.id == Asset.current_employee_id).filter(Employee.employee_id == employee_id_str)
                
        assets = query.order_by(Asset.created_at.desc()).all()
        return [serialize_asset(a) for a in assets]

    @staticmethod
    def assign_asset(db: Session, asset_id: str, payload: AssetAssignSchema, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        try:
            asset_uuid = uuid.UUID(asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
            
        asset = db.query(Asset).filter(Asset.id == asset_uuid, Asset.tenant_id == tenant_id, Asset.deleted_at == None).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        try:
            emp_uuid = uuid.UUID(payload.employeeId)
            emp = employee_repo.get_by_id(db, emp_uuid)
        except ValueError:
            emp = employee_repo.get_by_employee_id(db, payload.employeeId, tenant_id)
            
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        asset.status = "assigned"
        asset.current_employee_id = emp.id
        asset.assigned_at = datetime.utcnow()
        asset.condition = payload.condition
        if payload.remarks:
            asset.notes = payload.remarks
            
        assignment = AssetAssignment(
            tenant_id=tenant_id,
            employee_id=emp.id,
            asset_type=asset.category,
            asset_name=asset.name,
            serial_number=asset.serial_number,
            assigned_at=datetime.utcnow(),
            status="assigned"
        )
        db.add(assignment)
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="ASSET_ASSIGNED",
            details=f"Assigned asset tag {asset.asset_tag} to employee {emp.employee_id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(asset)
        return serialize_asset(asset)

    @staticmethod
    def return_asset(db: Session, asset_id: str, payload: AssetReturnSchema, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        try:
            asset_uuid = uuid.UUID(asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
            
        asset = db.query(Asset).filter(Asset.id == asset_uuid, Asset.tenant_id == tenant_id, Asset.deleted_at == None).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        prev_employee_id = asset.current_employee_id
        if not prev_employee_id:
            raise HTTPException(status_code=400, detail="Asset is not currently assigned to any employee")
            
        emp = employee_repo.get_by_id(db, prev_employee_id)
        emp_code = emp.employee_id if emp else "unknown"
        
        asset.status = "available"
        asset.current_employee_id = None
        asset.returned_at = datetime.utcnow()
        asset.condition = payload.condition
        if payload.remarks:
            asset.notes = payload.remarks
            
        assignment = db.query(AssetAssignment).filter(
            AssetAssignment.employee_id == prev_employee_id,
            AssetAssignment.tenant_id == tenant_id,
            AssetAssignment.serial_number == asset.serial_number,
            AssetAssignment.status == "assigned",
            AssetAssignment.deleted_at == None
        ).first()
        if assignment:
            assignment.status = "returned"
            
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="ASSET_RETURNED",
            details=f"Returned asset tag {asset.asset_tag} from employee {emp_code}"
        )
        db.add(audit)
        db.commit()
        db.refresh(asset)
        return serialize_asset(asset)

    @staticmethod
    def get_by_employee(db: Session, employee_id_str: str, tenant_id: uuid.UUID) -> List[dict]:
        try:
            emp_uuid = uuid.UUID(employee_id_str)
            emp = employee_repo.get_by_id(db, emp_uuid)
        except ValueError:
            emp = employee_repo.get_by_employee_id(db, employee_id_str, tenant_id)
            
        if not emp or emp.tenant_id != tenant_id:
            return []
            
        assets = db.query(Asset).filter(Asset.current_employee_id == emp.id, Asset.tenant_id == tenant_id, Asset.deleted_at == None).all()
        return [serialize_asset(a) for a in assets]

    @staticmethod
    def get_summary(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        summary = db.query(Asset.status, func.count(Asset.id)).filter(Asset.tenant_id == tenant_id, Asset.deleted_at == None).group_by(Asset.status).all()
        return [{"_id": s, "count": c} for s, c in summary]
