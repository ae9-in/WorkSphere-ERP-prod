from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.crm import CRMService
from app.schemas.crm import (
    LeadCreate, LeadStageUpdate, CustomerCreate,
    QuotationCreate, SalesOrderCreate, CRMTaskCreate
)

router = APIRouter(prefix="/crm", tags=["CRM & Sales"])

@router.get("/dashboard", summary="Get CRM lead pipelines, deal value, and win rate metrics")
def get_dashboard(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.get_dashboard(db, user.company_id)}

@router.get("/leads", summary="Get Leads list")
def get_leads(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.get_leads(db, user.company_id)}

@router.post("/leads", status_code=status.HTTP_201_CREATED, summary="Create a new lead log")
def create_lead(payload: LeadCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.create_lead(db, payload, user.company_id)}

@router.patch("/leads/{lead_id}/stage", summary="Update pipeline stage of a lead via Kanban drag-drop")
def update_lead_stage(lead_id: str, payload: LeadStageUpdate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.update_lead_stage(db, lead_id, payload, user.company_id)}

@router.get("/customers", summary="Get Customer Accounts list")
def get_customers(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.get_customers(db, user.company_id)}

@router.post("/customers", status_code=status.HTTP_201_CREATED, summary="Create customer account profile")
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.create_customer(db, payload, user.company_id)}

@router.get("/quotations", summary="Get quotes history log")
def get_quotations(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.get_quotations(db, user.company_id)}

@router.post("/quotations", status_code=status.HTTP_201_CREATED, summary="Generate quotation voucher")
def create_quotation(payload: QuotationCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.create_quotation(db, payload, user.company_id)}

@router.get("/orders", summary="Get sales orders log")
def get_orders(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.get_sales_orders(db, user.company_id)}

@router.post("/orders", status_code=status.HTTP_201_CREATED, summary="Log a new sales order")
def create_order(payload: SalesOrderCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.create_sales_order(db, payload, user.company_id)}

@router.get("/tasks", summary="Get scheduled CRM activities and follow-ups")
def get_tasks(db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.get_tasks(db, user.company_id)}

@router.post("/tasks", status_code=status.HTTP_201_CREATED, summary="Schedule follow-up activity call or meeting")
def create_task(payload: CRMTaskCreate, db: Session = Depends(get_db), user: User = Depends(verify_tenant)):
    return {"success": True, "data": CRMService.create_task(db, payload, user.company_id)}
