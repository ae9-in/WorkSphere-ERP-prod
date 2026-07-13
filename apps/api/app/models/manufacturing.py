from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import TenantBaseModel
from datetime import datetime

class ManufacturingPlant(TenantBaseModel):
    __tablename__ = "manufacturing_plants"

    code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    manager_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(String, default="active") # active, inactive

class ProductionCalendar(TenantBaseModel):
    __tablename__ = "production_calendars"

    plant_id = Column(UUID(as_uuid=True), ForeignKey("manufacturing_plants.id"), nullable=False)
    name = Column(String, nullable=False)
    working_days = Column(String, nullable=True) # e.g. Monday,Tuesday,Wednesday
    shifts = Column(String, nullable=True) # e.g. Morning,Evening,Night
    holidays = Column(String, nullable=True) # comma separated dates
    status = Column(String, default="active")

class BillOfMaterials(TenantBaseModel):
    __tablename__ = "bill_of_materials"

    bom_number = Column(String, nullable=False, index=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    version = Column(String, default="1.0.0")
    is_active = Column(Boolean, default=True)
    status = Column(String, default="approved") # pending, approved, obsolete

class BOMComponent(TenantBaseModel):
    __tablename__ = "bom_components"

    bom_id = Column(UUID(as_uuid=True), ForeignKey("bill_of_materials.id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    uom = Column(String, default="piece")

class RoutingMaster(TenantBaseModel):
    __tablename__ = "routing_master"

    code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    version = Column(String, default="1.0.0")
    is_active = Column(Boolean, default=True)

class RoutingOperation(TenantBaseModel):
    __tablename__ = "routing_operations"

    routing_id = Column(UUID(as_uuid=True), ForeignKey("routing_master.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    work_center_id = Column(UUID(as_uuid=True), ForeignKey("work_centers.id"), nullable=False)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=True)
    standard_time = Column(Float, default=1.0) # hours
    setup_time = Column(Float, default=0.1) # hours
    labor_time = Column(Float, default=1.0) # hours
    is_inspection_point = Column(Boolean, default=False)
    output_quantity = Column(Float, default=1.0)

class WorkCenter(TenantBaseModel):
    __tablename__ = "work_centers"

    code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    capacity = Column(Float, default=100.0) # daily capacity units
    shift_schedule = Column(String, nullable=True)
    status = Column(String, default="active") # active, inactive

class Machine(TenantBaseModel):
    __tablename__ = "machines"

    machine_code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    equipment_type = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    installation_date = Column(DateTime, default=datetime.utcnow)
    maintenance_schedule = Column(String, nullable=True)
    calibration_status = Column(String, default="calibrated")
    status = Column(String, default="active") # active, idle, downtime
    utilization_rate = Column(Float, default=0.0)

class ProductionOrder(TenantBaseModel):
    __tablename__ = "production_orders"

    order_number = Column(String, nullable=False, index=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    bom_id = Column(UUID(as_uuid=True), ForeignKey("bill_of_materials.id"), nullable=False)
    routing_id = Column(UUID(as_uuid=True), ForeignKey("routing_master.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    planned_start = Column(DateTime, nullable=True)
    planned_finish = Column(DateTime, nullable=True)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("manufacturing_plants.id"), nullable=False)
    work_center_id = Column(UUID(as_uuid=True), ForeignKey("work_centers.id"), nullable=True)
    status = Column(String, default="draft") # draft, released, in_progress, completed, cancelled

class WorkOrder(TenantBaseModel):
    __tablename__ = "work_orders"

    work_order_number = Column(String, nullable=False, index=True)
    production_order_id = Column(UUID(as_uuid=True), ForeignKey("production_orders.id"), nullable=False)
    bom_id = Column(UUID(as_uuid=True), ForeignKey("bill_of_materials.id"), nullable=False)
    routing_id = Column(UUID(as_uuid=True), ForeignKey("routing_master.id"), nullable=False)
    work_center_id = Column(UUID(as_uuid=True), ForeignKey("work_centers.id"), nullable=False)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True)
    planned_quantity = Column(Float, nullable=False)
    produced_quantity = Column(Float, default=0.0)
    scrap_quantity = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, running, paused, completed, cancelled

class MaterialConsumption(TenantBaseModel):
    __tablename__ = "material_consumption"

    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    batch_number = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    quantity_consumed = Column(Float, nullable=False)
    waste_quantity = Column(Float, default=0.0)

class WorkInProgress(TenantBaseModel):
    __tablename__ = "work_in_progress"

    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    current_operation_seq = Column(Integer, default=1)
    quantity_completed = Column(Float, default=0.0)
    quantity_remaining = Column(Float, nullable=False)
    material_cost = Column(Float, default=0.0)
    labor_hours = Column(Float, default=0.0)
    machine_hours = Column(Float, default=0.0)
    estimated_completion = Column(DateTime, nullable=True)

class ProductionOutput(TenantBaseModel):
    __tablename__ = "production_output"

    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    good_quantity = Column(Float, nullable=False)
    scrap_quantity = Column(Float, default=0.0)
    rejected_quantity = Column(Float, default=0.0)
    location_id = Column(UUID(as_uuid=True), nullable=True)

class QualityInspection(TenantBaseModel):
    __tablename__ = "quality_inspections"

    inspection_number = Column(String, nullable=False, index=True)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    stage = Column(String, nullable=False) # incoming, in_process, final, batch
    result = Column(String, nullable=False) # pass, conditional_pass, rework, reject
    inspector_email = Column(String, nullable=False)
    inspection_date = Column(DateTime, default=datetime.utcnow)
    criteria = Column(String, nullable=True) # JSON criteria as string
    remarks = Column(String, nullable=True)

class NonConformanceReport(TenantBaseModel):
    __tablename__ = "non_conformance_reports"

    ncr_number = Column(String, nullable=False, index=True)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey("quality_inspections.id"), nullable=False)
    defect_details = Column(String, nullable=False)
    root_cause = Column(String, nullable=True)
    corrective_action = Column(String, nullable=True) # CAPA details
    status = Column(String, default="open") # open, under_review, closed

class ScrapRecord(TenantBaseModel):
    __tablename__ = "scrap_records"

    scrap_number = Column(String, nullable=False, index=True)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    scrap_category = Column(String, nullable=False) # material, process, quality, machine, setup, packaging
    quantity = Column(Float, nullable=False)
    cost = Column(Float, default=0.0)
    reason = Column(String, nullable=True)

class MachinePerformance(TenantBaseModel):
    __tablename__ = "machine_performance"

    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    runtime = Column(Float, default=0.0) # hours
    downtime = Column(Float, default=0.0) # hours
    idle_time = Column(Float, default=0.0) # hours
    maintenance_time = Column(Float, default=0.0) # hours
    availability_rate = Column(Float, default=100.0) # percentage
    performance_rate = Column(Float, default=100.0) # percentage
    quality_rate = Column(Float, default=100.0) # percentage
    oee = Column(Float, default=100.0) # overall OEE percentage

class ProductionAnalytics(TenantBaseModel):
    __tablename__ = "production_analytics"

    plant_id = Column(UUID(as_uuid=True), ForeignKey("manufacturing_plants.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    daily_demand = Column(Float, default=0.0)
    daily_production_volume = Column(Float, default=0.0)
    yield_rate = Column(Float, default=100.0)
    scrap_rate = Column(Float, default=0.0)
    throughput_rate = Column(Float, default=0.0)
    labor_productivity = Column(Float, default=0.0)

class ManufacturingTimeline(TenantBaseModel):
    __tablename__ = "manufacturing_timelines"

    production_order_id = Column(UUID(as_uuid=True), ForeignKey("production_orders.id"), nullable=True)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    event_type = Column(String, nullable=False) # started, running, paused, completed, etc.
    details = Column(String, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow)

class ManufacturingAuditLog(TenantBaseModel):
    __tablename__ = "manufacturing_audit_logs"

    user_id = Column(UUID(as_uuid=True), nullable=False)
    email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
