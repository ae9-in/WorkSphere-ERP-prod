from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Integer, JSON, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.base import TenantBaseModel, BaseModel

class Lead(TenantBaseModel):
    __tablename__ = "crm_leads"

    company         = Column(String, nullable=False)
    contact_person  = Column(String, nullable=False)
    phone           = Column(String, nullable=True)
    email           = Column(String, nullable=True)
    designation     = Column(String, nullable=True)
    industry        = Column(String, nullable=True)
    company_size    = Column(String, nullable=True)
    lead_source     = Column(String, default="Direct", nullable=False)
    priority        = Column(String, default="medium", nullable=False)  # low, medium, high
    estimated_value = Column(Float, default=0.0, nullable=False)
    expected_close  = Column(Date, nullable=True)
    stage           = Column(String, default="new", nullable=False)  # new, contacted, qualified, proposal, negotiation, won, lost
    probability     = Column(Float, default=10.0, nullable=False)  # in percentage
    status          = Column(String, default="active", nullable=False)  # active, converted, lost
    lead_owner      = Column(String, nullable=True)

class Customer(TenantBaseModel):
    __tablename__ = "crm_customers"

    company_name    = Column(String, nullable=False)
    gst             = Column(String, nullable=True)
    pan             = Column(String, nullable=True)
    email           = Column(String, nullable=True)
    phone           = Column(String, nullable=True)
    address         = Column(Text, nullable=True)
    industry        = Column(String, nullable=True)
    employees       = Column(Integer, default=0, nullable=False)
    revenue         = Column(Float, default=0.0, nullable=False)
    relationship_score = Column(Float, default=80.0, nullable=False)

    contacts        = relationship("Contact", back_populates="customer", cascade="all, delete-orphan")
    quotations      = relationship("Quotation", back_populates="customer", cascade="all, delete-orphan")
    orders          = relationship("SalesOrder", back_populates="customer", cascade="all, delete-orphan")

class Contact(BaseModel):
    __tablename__ = "crm_contacts"

    customer_id     = Column(UUID(as_uuid=True), ForeignKey("crm_customers.id", ondelete="CASCADE"), nullable=False)
    full_name       = Column(String, nullable=False)
    designation     = Column(String, nullable=True)
    email           = Column(String, nullable=True)
    phone           = Column(String, nullable=True)
    is_primary      = Column(Boolean, default=False, nullable=False)

    customer        = relationship("Customer", back_populates="contacts")

class Quotation(TenantBaseModel):
    __tablename__ = "crm_quotations"

    quotation_number = Column(String, nullable=False, unique=True, index=True)
    customer_id      = Column(UUID(as_uuid=True), ForeignKey("crm_customers.id", ondelete="CASCADE"), nullable=False)
    issue_date       = Column(Date, nullable=False)
    valid_until      = Column(Date, nullable=False)
    status           = Column(String, default="draft", nullable=False)  # draft, sent, approved, accepted, expired, rejected
    discount         = Column(Float, default=0.0, nullable=False)
    tax_rate         = Column(Float, default=0.0, nullable=False)
    tax_amount       = Column(Float, default=0.0, nullable=False)
    total_amount     = Column(Float, default=0.0, nullable=False)
    currency         = Column(String, default="INR", nullable=False)

    customer         = relationship("Customer", back_populates="quotations")
    items            = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")

class QuotationItem(BaseModel):
    __tablename__ = "crm_quotation_items"

    quotation_id     = Column(UUID(as_uuid=True), ForeignKey("crm_quotations.id", ondelete="CASCADE"), nullable=False)
    product_name     = Column(String, nullable=False)
    quantity         = Column(Integer, default=1, nullable=False)
    unit_price       = Column(Float, default=0.0, nullable=False)
    tax_rate         = Column(Float, default=0.0, nullable=False)
    tax_amount       = Column(Float, default=0.0, nullable=False)
    total_amount     = Column(Float, default=0.0, nullable=False)

    quotation        = relationship("Quotation", back_populates="items")

class SalesOrder(TenantBaseModel):
    __tablename__ = "crm_sales_orders"

    order_number     = Column(String, nullable=False, unique=True, index=True)
    customer_id      = Column(UUID(as_uuid=True), ForeignKey("crm_customers.id", ondelete="CASCADE"), nullable=False)
    quotation_id     = Column(UUID(as_uuid=True), ForeignKey("crm_quotations.id", ondelete="SET NULL"), nullable=True)
    order_date       = Column(Date, nullable=False)
    status           = Column(String, default="pending", nullable=False)  # pending, approved, allocated, dispatched, completed, cancelled
    total_amount     = Column(Float, default=0.0, nullable=False)
    shipping_address = Column(Text, nullable=True)
    tracking_number  = Column(String, nullable=True)
    courier_partner  = Column(String, nullable=True)

    customer         = relationship("Customer", back_populates="orders")
    items            = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")

class SalesOrderItem(BaseModel):
    __tablename__ = "crm_sales_order_items"

    order_id         = Column(UUID(as_uuid=True), ForeignKey("crm_sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_name     = Column(String, nullable=False)
    quantity         = Column(Integer, default=1, nullable=False)
    unit_price       = Column(Float, default=0.0, nullable=False)
    tax_rate         = Column(Float, default=0.0, nullable=False)
    tax_amount       = Column(Float, default=0.0, nullable=False)
    total_amount     = Column(Float, default=0.0, nullable=False)

    order            = relationship("SalesOrder", back_populates="items")

class CRMTask(TenantBaseModel):
    __tablename__ = "crm_tasks"

    lead_id          = Column(UUID(as_uuid=True), ForeignKey("crm_leads.id", ondelete="CASCADE"), nullable=True)
    customer_id      = Column(UUID(as_uuid=True), ForeignKey("crm_customers.id", ondelete="CASCADE"), nullable=True)
    task_type        = Column(String, nullable=False)  # call, meeting, email, task
    due_date         = Column(Date, nullable=False)
    status           = Column(String, default="pending", nullable=False)  # pending, completed, overdue
    priority         = Column(String, default="medium", nullable=False)  # low, medium, high
    notes            = Column(Text, nullable=True)
    assigned_to      = Column(String, nullable=True)

    lead             = relationship("Lead")
    customer         = relationship("Customer")
