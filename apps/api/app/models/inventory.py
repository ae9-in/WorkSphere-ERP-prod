import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, JSON, UniqueConstraint, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel, BaseModel

class InventoryCategory(TenantBaseModel):
    __tablename__ = "inventory_categories"
    
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_category_code"),
    )

class InventoryItem(TenantBaseModel):
    __tablename__ = "inventory_items"
    
    item_code = Column(String, nullable=False)
    sku = Column(String, nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    description = Column(String, nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("inventory_categories.id", ondelete="SET NULL"), nullable=True)
    uom = Column(String, nullable=False, default="piece")
    tax_category = Column(String, nullable=True)
    barcode = Column(String, nullable=True)
    qr_code = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False) # active, draft, archived
    
    # Governance Policies
    min_stock = Column(Float, default=0.0, nullable=False)
    max_stock = Column(Float, default=0.0, nullable=False)
    safety_stock = Column(Float, default=0.0, nullable=False)
    reorder_point = Column(Float, default=0.0, nullable=False)
    preferred_vendor = Column(String, nullable=True)
    default_warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        UniqueConstraint("tenant_id", "item_code", name="uq_tenant_item_code"),
        UniqueConstraint("tenant_id", "sku", name="uq_tenant_sku"),
    )

class Warehouse(TenantBaseModel):
    __tablename__ = "warehouses"
    
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    capacity = Column(Float, nullable=True) # capacity in units
    type = Column(String, default="distribution", nullable=False) # raw, finished, retail, distribution
    status = Column(String, default="active", nullable=False) # active, inactive
    currency = Column(String, default="INR", nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_warehouse_code"),
    )

class WarehouseLocation(TenantBaseModel):
    __tablename__ = "warehouse_locations"
    
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False)
    zone = Column(String, nullable=True)
    aisle = Column(String, nullable=True)
    rack = Column(String, nullable=True)
    shelf = Column(String, nullable=True)
    bin = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False) # active, full, inactive

    __table_args__ = (
        UniqueConstraint("tenant_id", "warehouse_id", "code", name="uq_tenant_location_code"),
    )

class StockBalance(TenantBaseModel):
    __tablename__ = "stock_balances"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, default=0.0, nullable=False)
    reserved_quantity = Column(Float, default=0.0, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "item_id", "warehouse_id", "location_id", name="uq_tenant_item_stock_location"),
    )

class StockMovement(TenantBaseModel):
    __tablename__ = "stock_movements"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    type = Column(String, nullable=False) # stock_in, stock_out, transfer_out, transfer_in, adjustment_in, adjustment_out
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False, default=0.0)
    reference_type = Column(String, nullable=True) # po, sales_order, count, transfer, adjustment, return
    reference_id = Column(String, nullable=True)
    remarks = Column(String, nullable=True)

class StockBatch(TenantBaseModel):
    __tablename__ = "stock_batches"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String, nullable=False)
    manufacturing_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    quantity = Column(Float, nullable=False, default=0.0)
    vendor = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)
    status = Column(String, default="quarantine", nullable=False) # approved, quarantined, rejected, expired

    __table_args__ = (
        UniqueConstraint("tenant_id", "item_id", "batch_number", name="uq_tenant_item_batch"),
    )

class StockSerial(TenantBaseModel):
    __tablename__ = "stock_serials"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    serial_number = Column(String, nullable=False)
    purchase_date = Column(DateTime, nullable=True)
    warranty_expiry = Column(DateTime, nullable=True)
    status = Column(String, default="available", nullable=False) # available, assigned, maintenance, retired
    current_location_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        UniqueConstraint("tenant_id", "item_id", "serial_number", name="uq_tenant_item_serial"),
    )

class WarehouseTask(TenantBaseModel):
    __tablename__ = "warehouse_tasks"
    
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    task_type = Column(String, nullable=False) # receiving, put_away, picking, packing, dispatch, count, inspection
    status = Column(String, default="pending", nullable=False) # pending, in_progress, completed, cancelled
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    reference_type = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)
    remarks = Column(String, nullable=True)

class InventoryCount(TenantBaseModel):
    __tablename__ = "inventory_counts"
    
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    count_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, completed, approved, rejected
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

class InventoryCountItem(TenantBaseModel):
    __tablename__ = "inventory_count_items"
    
    count_id = Column(UUID(as_uuid=True), ForeignKey("inventory_counts.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    system_quantity = Column(Float, nullable=False, default=0.0)
    counted_quantity = Column(Float, nullable=False, default=0.0)
    variance = Column(Float, nullable=False, default=0.0)
    remarks = Column(String, nullable=True)

class InventoryAdjustment(TenantBaseModel):
    __tablename__ = "inventory_adjustments"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    quantity_adjusted = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False, default=0.0)
    type = Column(String, nullable=False) # in, out
    reason = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, approved, rejected
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

class InventoryValuation(TenantBaseModel):
    __tablename__ = "inventory_valuations"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    valuation_method = Column(String, nullable=False) # FIFO, LIFO, Weighted_Average
    unit_cost = Column(Float, nullable=False)
    total_quantity = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    valuation_date = Column(DateTime, default=datetime.utcnow, nullable=False)

class ReorderRecommendation(TenantBaseModel):
    __tablename__ = "reorder_recommendations"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    current_stock = Column(Float, nullable=False)
    safety_stock = Column(Float, nullable=False)
    reorder_point = Column(Float, nullable=False)
    recommended_quantity = Column(Float, nullable=False)
    priority = Column(String, default="medium", nullable=False) # low, medium, high
    status = Column(String, default="pending", nullable=False) # pending, ignored, ordered

class InventoryForecast(TenantBaseModel):
    __tablename__ = "inventory_forecasts"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(DateTime, nullable=False)
    forecasted_quantity = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.0)
    details = Column(String, nullable=True)

class InventoryTimeline(TenantBaseModel):
    __tablename__ = "inventory_timelines"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False) # created, stock_in, stock_out, transfer, count, adjusted
    details = Column(String, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow, nullable=False)

class StockReservation(TenantBaseModel):
    __tablename__ = "stock_reservations"
    
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, nullable=False)
    reference_type = Column(String, nullable=False) # sales_order, work_order, project
    reference_id = Column(String, nullable=False)
    status = Column(String, default="active", nullable=False) # active, completed, cancelled
    expiry_date = Column(DateTime, nullable=True)
    reserved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class InventoryQualityInspection(TenantBaseModel):
    __tablename__ = "inventory_quality_inspections"
    
    batch_id = Column(UUID(as_uuid=True), ForeignKey("stock_batches.id", ondelete="CASCADE"), nullable=False)
    inspector_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    inspection_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    checklist = Column(JSON, nullable=False) # {"packaging_intact": true, "dimensions_correct": true}
    sample_size = Column(Float, nullable=False, default=1.0)
    failed_quantity = Column(Float, nullable=False, default=0.0)
    status = Column(String, default="pending", nullable=False) # pending, passed, failed
    remarks = Column(String, nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class LandedCostVoucher(TenantBaseModel):
    __tablename__ = "landed_cost_vouchers"
    
    voucher_number = Column(String, nullable=False)
    posting_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    distribute_by = Column(String, default="quantity", nullable=False) # quantity, value, volume
    total_expenses = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="draft", nullable=False) # draft, posted, cancelled
    
    __table_args__ = (
        UniqueConstraint("tenant_id", "voucher_number", name="uq_tenant_lcv_number"),
    )

class LandedCostItem(TenantBaseModel):
    __tablename__ = "landed_cost_items"
    
    voucher_id = Column(UUID(as_uuid=True), ForeignKey("landed_cost_vouchers.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    purchase_receipt_id = Column(String, nullable=False)
    receipt_quantity = Column(Float, nullable=False)
    allocated_expense = Column(Float, nullable=False, default=0.0)
    adjusted_unit_cost = Column(Float, nullable=False, default=0.0)

class SerialAssetAssignment(TenantBaseModel):
    __tablename__ = "serial_asset_assignments"
    
    serial_id = Column(UUID(as_uuid=True), ForeignKey("stock_serials.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    condition_on_assign = Column(String, nullable=False, default="good")
    condition_on_return = Column(String, nullable=True)
    status = Column(String, default="assigned", nullable=False) # assigned, returned

class Supplier(TenantBaseModel):
    __tablename__ = "inventory_suppliers"

    company_name  = Column(String, nullable=False)
    supplier_code = Column(String, nullable=False, unique=True, index=True)
    gst           = Column(String, nullable=True)
    pan           = Column(String, nullable=True)
    email         = Column(String, nullable=True)
    phone         = Column(String, nullable=True)
    address       = Column(Text, nullable=True)
    payment_terms = Column(String, nullable=True)
    lead_time_days = Column(Integer, default=7, nullable=False)
    rating        = Column(Float, default=5.0, nullable=False)

class PurchaseOrder(TenantBaseModel):
    __tablename__ = "inventory_purchase_orders"

    po_number     = Column(String, nullable=False, unique=True, index=True)
    supplier_id   = Column(UUID(as_uuid=True), ForeignKey("inventory_suppliers.id", ondelete="CASCADE"), nullable=False)
    order_date    = Column(Date, nullable=False)
    expected_delivery = Column(Date, nullable=True)
    status        = Column(String, default="draft", nullable=False)  # draft, pending, approved, delivered, cancelled
    tax_rate      = Column(Float, default=18.0, nullable=False)
    tax_amount    = Column(Float, default=0.0, nullable=False)
    total_amount  = Column(Float, default=0.0, nullable=False)
    shipping_address = Column(Text, nullable=True)

    supplier      = relationship("Supplier")
    items         = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(BaseModel):
    __tablename__ = "inventory_purchase_order_items"

    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("inventory_purchase_orders.id", ondelete="CASCADE"), nullable=False)
    item_id       = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    quantity      = Column(Float, default=1.0, nullable=False)
    unit_price    = Column(Float, default=0.0, nullable=False)
    tax_rate      = Column(Float, default=18.0, nullable=False)
    tax_amount    = Column(Float, default=0.0, nullable=False)
    total_amount  = Column(Float, default=0.0, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    item          = relationship("InventoryItem")

class GoodsReceipt(TenantBaseModel):
    __tablename__ = "inventory_goods_receipts"

    grn_number    = Column(String, nullable=False, unique=True, index=True)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("inventory_purchase_orders.id", ondelete="CASCADE"), nullable=False)
    receipt_date  = Column(Date, nullable=False)
    status        = Column(String, default="completed", nullable=False)
    remarks       = Column(Text, nullable=True)

    purchase_order = relationship("PurchaseOrder")
