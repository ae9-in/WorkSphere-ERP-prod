from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import TenantBaseModel
from datetime import datetime

class MaintenanceAsset(TenantBaseModel):
    __tablename__ = "maintenance_assets"

    asset_code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False) # CNC, Assembly, Electrical, HVAC, etc.
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    installation_date = Column(DateTime, default=datetime.utcnow)
    warranty_expiry = Column(DateTime, nullable=True)
    status = Column(String, default="active") # active, down, retired
    plant_id = Column(UUID(as_uuid=True), ForeignKey("manufacturing_plants.id"), nullable=True)
    department = Column(String, nullable=True)

class EquipmentMaster(TenantBaseModel):
    __tablename__ = "equipment_master"

    code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

class AssetHierarchy(TenantBaseModel):
    __tablename__ = "asset_hierarchy"

    parent_asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=True)
    child_asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    relation_type = Column(String, default="component") # area, line, machine, component

class MaintenancePlan(TenantBaseModel):
    __tablename__ = "maintenance_plans"

    plan_number = Column(String, nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    maintenance_type = Column(String, default="preventive") # preventive, inspection, calibration
    frequency = Column(String, default="monthly") # daily, weekly, monthly, quarterly, annual, runtime
    checklist = Column(String, nullable=True) # JSON checklist string
    estimated_duration = Column(Float, default=1.0) # hours
    safety_instructions = Column(String, nullable=True)

class MaintenanceCalendar(TenantBaseModel):
    __tablename__ = "maintenance_calendar"

    plan_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_plans.id"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(String, default="scheduled") # scheduled, completed, missed

class MaintenanceRequest(TenantBaseModel):
    __tablename__ = "maintenance_requests"

    request_number = Column(String, nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    requester_email = Column(String, nullable=False)
    department = Column(String, nullable=True)
    problem_description = Column(String, nullable=False)
    priority = Column(String, default="medium") # low, medium, high, critical
    requested_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending") # pending, approved, rejected

class MaintenanceWorkOrder(TenantBaseModel):
    __tablename__ = "maintenance_work_orders"

    work_order_number = Column(String, nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    request_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_requests.id"), nullable=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_plans.id"), nullable=True)
    maintenance_type = Column(String, default="corrective") # preventive, corrective, emergency, inspection
    assigned_technician_id = Column(UUID(as_uuid=True), nullable=True)
    planned_start = Column(DateTime, nullable=True)
    planned_finish = Column(DateTime, nullable=True)
    estimated_labor_hours = Column(Float, default=1.0)
    safety_checklist = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, in_progress, completed, cancelled

class TechnicianAssignment(TenantBaseModel):
    __tablename__ = "technician_assignments"

    technician_id = Column(UUID(as_uuid=True), nullable=False)
    email = Column(String, nullable=False)
    skill_name = Column(String, nullable=False)
    certification_details = Column(String, nullable=True)
    shift_schedule = Column(String, nullable=True)
    status = Column(String, default="active") # active, inactive

class MaintenanceInspection(TenantBaseModel):
    __tablename__ = "maintenance_inspections"

    inspection_number = Column(String, nullable=False, index=True)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_work_orders.id"), nullable=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    stage = Column(String, nullable=False) # visual, electrical, calibration
    result = Column(String, nullable=False) # pass, fail
    inspector_email = Column(String, nullable=False)
    inspection_date = Column(DateTime, default=datetime.utcnow)
    criteria = Column(String, nullable=True) # JSON string
    remarks = Column(String, nullable=True)

class InspectionChecklist(TenantBaseModel):
    __tablename__ = "inspection_checklists"

    name = Column(String, nullable=False)
    version = Column(String, default="1.0.0")
    checklist_data = Column(String, nullable=False) # JSON template string

class SparePartsConsumption(TenantBaseModel):
    __tablename__ = "spare_parts_consumption"

    work_order_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_work_orders.id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    quantity_consumed = Column(Float, nullable=False)
    cost = Column(Float, default=0.0)

class MaintenanceHistory(TenantBaseModel):
    __tablename__ = "maintenance_history"

    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    event_type = Column(String, nullable=False) # installed, work_order, breakdown, retired
    event_date = Column(DateTime, default=datetime.utcnow)
    details = Column(String, nullable=True)
    cost = Column(Float, default=0.0)

class AssetHealth(TenantBaseModel):
    __tablename__ = "asset_health"

    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    health_score = Column(Float, default=100.0)
    operating_hours = Column(Float, default=0.0)
    runtime_hours = Column(Float, default=0.0)
    downtime_hours = Column(Float, default=0.0)
    temperature = Column(Float, default=25.0) # Celsius
    vibration = Column(Float, default=0.15) # mm/s
    power_consumption = Column(Float, default=1.2) # kW

class PredictiveAlert(TenantBaseModel):
    __tablename__ = "predictive_alerts"

    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    alert_date = Column(DateTime, default=datetime.utcnow)
    failure_probability = Column(Float, default=0.0) # percentage
    remaining_useful_life_days = Column(Float, default=365.0)
    recommended_action = Column(String, nullable=True)
    confidence_score = Column(Float, default=100.0)
    status = Column(String, default="active") # active, dismissed, resolved

class MaintenanceCost(TenantBaseModel):
    __tablename__ = "maintenance_costs"

    work_order_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_work_orders.id"), nullable=False)
    labor_cost = Column(Float, default=0.0)
    parts_cost = Column(Float, default=0.0)
    downtime_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)

class ReliabilityMetric(TenantBaseModel):
    __tablename__ = "reliability_metrics"

    asset_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_assets.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    mtbf_hours = Column(Float, default=0.0)
    mttr_hours = Column(Float, default=0.0)
    availability_rate = Column(Float, default=100.0)
    failures_count = Column(Integer, default=0)
    total_runtime_hours = Column(Float, default=0.0)

class MaintenanceAnalytics(TenantBaseModel):
    __tablename__ = "maintenance_analytics"

    date = Column(DateTime, default=datetime.utcnow)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("manufacturing_plants.id"), nullable=True)
    breakdowns_count = Column(Integer, default=0)
    total_maintenance_cost = Column(Float, default=0.0)
    labor_hours_logged = Column(Float, default=0.0)

class MaintenanceTimeline(TenantBaseModel):
    __tablename__ = "maintenance_timelines"

    work_order_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_work_orders.id"), nullable=True)
    request_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_requests.id"), nullable=True)
    event_type = Column(String, nullable=False) # submitted, approved, assigned, completed
    details = Column(String, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow)

class MaintenanceAuditLog(TenantBaseModel):
    __tablename__ = "maintenance_audit_logs"

    user_id = Column(UUID(as_uuid=True), nullable=False)
    email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
