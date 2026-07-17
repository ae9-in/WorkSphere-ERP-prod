from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import datetime, date
from typing import List, Dict, Any
import uuid
import random

from app.models.crm import (
    Lead, Customer, Contact, Quotation,
    QuotationItem, SalesOrder, SalesOrderItem, CRMTask
)

class CRMService:
    @staticmethod
    def get_dashboard(db: Session, tenant_id: uuid.UUID) -> dict:
        """Returns live dynamic pipeline totals, win rate, and deal distributions."""
        total_leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).count()
        won_leads = db.query(Lead).filter(Lead.tenant_id == tenant_id, Lead.stage == "won").count()
        lost_leads = db.query(Lead).filter(Lead.tenant_id == tenant_id, Lead.stage == "lost").count()

        pipeline_val = db.query(func.sum(Lead.estimated_value)).filter(
            Lead.tenant_id == tenant_id, Lead.stage != "won", Lead.stage != "lost"
        ).scalar() or 0.0

        win_rate = (won_leads / (won_leads + lost_leads) * 100.0) if (won_leads + lost_leads) > 0 else 0.0

        # Stages list
        stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
        stage_vals = []
        for stg in stages:
            cnt = db.query(Lead).filter(Lead.tenant_id == tenant_id, Lead.stage == stg).count()
            val = db.query(func.sum(Lead.estimated_value)).filter(
                Lead.tenant_id == tenant_id, Lead.stage == stg
            ).scalar() or 0.0
            stage_vals.append({"stage": stg, "count": cnt, "value": val})

        return {
            "totalLeads": total_leads,
            "pipelineValue": pipeline_val,
            "winRate": win_rate,
            "wonLeadsCount": won_leads,
            "lostLeadsCount": lost_leads,
            "stageDistribution": stage_vals
        }

    @staticmethod
    def get_leads(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).all()
        return [{
            "id": str(l.id),
            "company": l.company,
            "contactPerson": l.contact_person,
            "phone": l.phone,
            "email": l.email,
            "designation": l.designation,
            "industry": l.industry,
            "companySize": l.company_size,
            "leadSource": l.lead_source,
            "priority": l.priority,
            "estimatedValue": l.estimated_value,
            "expectedClose": l.expected_close.isoformat() if l.expected_close else None,
            "stage": l.stage,
            "probability": l.probability,
            "status": l.status,
            "leadOwner": l.lead_owner
        } for l in leads]

    @staticmethod
    def create_lead(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        lead = Lead(
            tenant_id=tenant_id,
            company=payload.company,
            contact_person=payload.contactPerson,
            phone=payload.phone,
            email=payload.email,
            designation=payload.designation,
            industry=payload.industry,
            company_size=payload.companySize,
            lead_source=payload.leadSource or "Direct",
            priority=payload.priority or "medium",
            estimated_value=payload.estimatedValue or 0.0,
            expected_close=datetime.strptime(payload.expectedClose, "%Y-%m-%d").date() if payload.expectedClose else None,
            stage=payload.stage or "new",
            probability=payload.probability or 10.0,
            lead_owner=payload.leadOwner
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return {"id": str(lead.id), "company": lead.company}

    @staticmethod
    def update_lead_stage(db: Session, lead_id: str, payload: Any, tenant_id: uuid.UUID) -> dict:
        lead = db.query(Lead).filter(Lead.id == uuid.UUID(lead_id), Lead.tenant_id == tenant_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        lead.stage = payload.stage
        lead.probability = payload.probability
        db.commit()
        return {"id": str(lead.id), "stage": lead.stage}

    @staticmethod
    def get_customers(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        customers = db.query(Customer).filter(Customer.tenant_id == tenant_id).all()
        return [{
            "id": str(c.id),
            "companyName": c.company_name,
            "gst": c.gst,
            "pan": c.pan,
            "email": c.email,
            "phone": c.phone,
            "address": c.address,
            "industry": c.industry,
            "employees": c.employees,
            "revenue": c.revenue,
            "relationshipScore": c.relationship_score,
            "contacts": [{
                "fullName": cont.full_name,
                "designation": cont.designation,
                "email": cont.email,
                "phone": cont.phone,
                "isPrimary": cont.is_primary
            } for cont in c.contacts]
        } for c in customers]

    @staticmethod
    def create_customer(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        c = Customer(
            tenant_id=tenant_id,
            company_name=payload.companyName,
            gst=payload.gst,
            pan=payload.pan,
            email=payload.email,
            phone=payload.phone,
            address=payload.address,
            industry=payload.industry,
            employees=payload.employees or 0,
            revenue=payload.revenue or 0.0,
            relationship_score=85.0
        )
        db.add(c)
        db.commit()
        db.refresh(c)
        return {"id": str(c.id), "companyName": c.company_name}

    @staticmethod
    def get_quotations(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        quotes = db.query(Quotation).filter(Quotation.tenant_id == tenant_id).all()
        return [{
            "id": str(q.id),
            "quotationNumber": q.quotation_number,
            "customerName": q.customer.company_name,
            "customerId": str(q.customer_id),
            "issueDate": q.issue_date.isoformat(),
            "validUntil": q.valid_until.isoformat(),
            "status": q.status,
            "totalAmount": q.total_amount,
            "items": [{
                "productName": item.product_name,
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
                "totalAmount": item.total_amount
            } for item in q.items]
        } for q in quotes]

    @staticmethod
    def create_quotation(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        q_number = f"QT-2026-{random.randint(1000, 9999)}"
        items_total = 0.0
        for item in payload.items:
            items_total += item.quantity * item.unitPrice

        tax_amount = items_total * 0.18  # Default 18% GST output
        total_amount = (items_total - payload.discount) + tax_amount

        q = Quotation(
            tenant_id=tenant_id,
            quotation_number=q_number,
            customer_id=uuid.UUID(payload.customerId),
            issue_date=datetime.strptime(payload.issueDate, "%Y-%m-%d").date(),
            valid_until=datetime.strptime(payload.validUntil, "%Y-%m-%d").date(),
            status="sent",
            discount=payload.discount,
            tax_rate=18.0,
            tax_amount=tax_amount,
            total_amount=total_amount
        )
        db.add(q)
        db.flush()

        for item in payload.items:
            db.add(QuotationItem(
                quotation_id=q.id,
                product_name=item.productName,
                quantity=item.quantity,
                unit_price=item.unitPrice,
                tax_rate=18.0,
                tax_amount=item.quantity * item.unitPrice * 0.18,
                total_amount=item.quantity * item.unitPrice * 1.18
            ))
        db.commit()
        db.refresh(q)
        return {"id": str(q.id), "quotationNumber": q.quotation_number}

    @staticmethod
    def get_sales_orders(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        orders = db.query(SalesOrder).filter(SalesOrder.tenant_id == tenant_id).all()
        return [{
            "id": str(o.id),
            "orderNumber": o.order_number,
            "customerName": o.customer.company_name,
            "orderDate": o.order_date.isoformat(),
            "status": o.status,
            "totalAmount": o.total_amount,
            "shippingAddress": o.shipping_address,
            "trackingNumber": o.tracking_number,
            "courierPartner": o.courier_partner,
            "items": [{
                "productName": item.product_name,
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
                "totalAmount": item.total_amount
            } for item in o.items]
        } for o in orders]

    @staticmethod
    def create_sales_order(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        o_number = f"SO-2026-{random.randint(1000, 9999)}"
        items_total = 0.0
        for item in payload.items:
            items_total += item.quantity * item.unitPrice

        tax_amount = items_total * 0.18
        total_amount = items_total + tax_amount

        so = SalesOrder(
            tenant_id=tenant_id,
            order_number=o_number,
            customer_id=uuid.UUID(payload.customerId),
            quotation_id=uuid.UUID(payload.quotationId) if payload.quotationId else None,
            order_date=datetime.strptime(payload.orderDate, "%Y-%m-%d").date(),
            status="pending",
            total_amount=total_amount,
            shipping_address=payload.shippingAddress
        )
        db.add(so)
        db.flush()

        for item in payload.items:
            db.add(SalesOrderItem(
                order_id=so.id,
                product_name=item.productName,
                quantity=item.quantity,
                unit_price=item.unitPrice,
                tax_rate=18.0,
                tax_amount=item.quantity * item.unitPrice * 0.18,
                total_amount=item.quantity * item.unitPrice * 1.18
            ))
        db.commit()
        db.refresh(so)
        return {"id": str(so.id), "orderNumber": so.order_number}

    @staticmethod
    def get_tasks(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        tasks = db.query(CRMTask).filter(CRMTask.tenant_id == tenant_id).all()
        return [{
            "id": str(t.id),
            "leadId": str(t.lead_id) if t.lead_id else None,
            "customerId": str(t.customer_id) if t.customer_id else None,
            "taskType": t.task_type,
            "dueDate": t.due_date.isoformat(),
            "status": t.status,
            "priority": t.priority,
            "notes": t.notes,
            "assignedTo": t.assigned_to
        } for t in tasks]

    @staticmethod
    def create_task(db: Session, payload: Any, tenant_id: uuid.UUID) -> dict:
        task = CRMTask(
            tenant_id=tenant_id,
            lead_id=uuid.UUID(payload.leadId) if payload.leadId else None,
            customer_id=uuid.UUID(payload.customerId) if payload.customerId else None,
            task_type=payload.taskType,
            due_date=datetime.strptime(payload.dueDate, "%Y-%m-%d").date(),
            priority=payload.priority or "medium",
            notes=payload.notes,
            assigned_to=payload.assignedTo
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return {"id": str(task.id), "taskType": task.task_type}
