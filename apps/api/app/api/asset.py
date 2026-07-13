from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.schemas.asset import AssetCreateSchema, AssetAssignSchema, AssetReturnSchema
from app.services.asset import AssetService

router = APIRouter(prefix="/assets", tags=["assets"])

@router.post("", status_code=201)
def create_asset(payload: AssetCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssetService.create_asset(
        db, payload=payload, tenant_id=tenant_id, author_id=user.id, author_email=user.email
    )
    return {
        "success": True,
        "data": result
    }

@router.get("")
def get_assets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    employeeId: Optional[str] = Query(None),
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = AssetService.list_assets(
        db, tenant_id=tenant_id, status=status, category=category, employee_id_str=employeeId
    )
    return {
        "success": True,
        "data": result
    }

@router.post("/{id}/assign")
def assign_asset(id: str, payload: AssetAssignSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssetService.assign_asset(
        db, asset_id=id, payload=payload, tenant_id=tenant_id, author_id=user.id, author_email=user.email
    )
    return {
        "success": True,
        "data": result
    }

@router.post("/{id}/return")
def return_asset(id: str, payload: AssetReturnSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssetService.return_asset(
        db, asset_id=id, payload=payload, tenant_id=tenant_id, author_id=user.id, author_email=user.email
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/employee/{employeeId}")
def get_assets_by_employee(employeeId: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssetService.get_by_employee(db, employee_id_str=employeeId, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/summary")
def get_asset_summary_report(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = AssetService.get_summary(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }
