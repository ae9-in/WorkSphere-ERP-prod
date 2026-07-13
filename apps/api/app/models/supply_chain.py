import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import TenantBaseModel

class SupplyChainNetwork(TenantBaseModel):
    __tablename__ = "supply_chain_network"

    node_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    node_type = Column(String, nullable=False)  # e.g., plant, vendor, cross_dock, warehouse, hub, retail, customer
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class DistributionCenter(TenantBaseModel):
    __tablename__ = "distribution_centers"

    center_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    capacity = Column(Float, nullable=True)
    manager_name = Column(String, nullable=True)
    operating_hours = Column(String, nullable=True)

class LogisticsPartner(TenantBaseModel):
    __tablename__ = "logistics_partners"

    partner_code = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False)
    contact_details = Column(String, nullable=True)
    service_areas = Column(String, nullable=True)
    supported_vehicles = Column(String, nullable=True)
    sla_terms = Column(String, nullable=True)
    insurance_info = Column(String, nullable=True)
    performance_rating = Column(Float, default=5.0)

class Carrier(TenantBaseModel):
    __tablename__ = "carriers"

    carrier_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    carrier_type = Column(String, nullable=False)  # Courier, 3PL, Air, Sea, Rail, Last Mile
    contract_version = Column(String, nullable=True)
    status = Column(String, default="active")  # active, suspended

class FleetVehicle(TenantBaseModel):
    __tablename__ = "fleet_vehicles"

    vehicle_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)  # Truck, Van, Pickup, Motorcycle, Container Truck, Trailer
    capacity_weight = Column(Float, nullable=False)
    capacity_volume = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=True)
    gps_device_id = Column(String, nullable=True)
    driver_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(String, default="available")  # available, in_transit, maintenance, idle
    maintenance_status = Column(String, default="good")
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)

class Driver(TenantBaseModel):
    __tablename__ = "drivers"

    driver_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    license_number = Column(String, nullable=False)
    license_expiry = Column(DateTime, nullable=True)
    certifications = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    assigned_vehicle_id = Column(UUID(as_uuid=True), nullable=True)
    availability_status = Column(String, default="active")  # active, on_leave, in_transit
    performance_rating = Column(Float, default=5.0)

class Shipment(TenantBaseModel):
    __tablename__ = "shipments"

    shipment_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    warehouse_code = Column(String, nullable=False)
    destination_address = Column(String, nullable=False)
    carrier_id = Column(UUID(as_uuid=True), nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), nullable=True)
    driver_id = Column(UUID(as_uuid=True), nullable=True)
    priority = Column(String, default="medium")  # low, medium, high, critical
    delivery_window_start = Column(DateTime, nullable=True)
    delivery_window_end = Column(DateTime, nullable=True)
    total_weight = Column(Float, default=0.0)
    total_volume = Column(Float, default=0.0)
    status = Column(String, default="planned")  # planned, vehicle_assigned, dispatched, in_transit, delivered, proof_of_delivery, closed

class ShipmentItem(TenantBaseModel):
    __tablename__ = "shipment_items"

    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False)
    item_code = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    weight = Column(Float, default=0.0)
    volume = Column(Float, default=0.0)

class DispatchOrder(TenantBaseModel):
    __tablename__ = "dispatch_orders"

    dispatch_number = Column(String, unique=True, index=True, nullable=False)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), nullable=False)
    driver_id = Column(UUID(as_uuid=True), nullable=False)
    loading_confirmed_at = Column(DateTime, default=datetime.utcnow)
    departure_time = Column(DateTime, nullable=True)
    expected_arrival = Column(DateTime, nullable=True)
    gate_pass_number = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, confirmed, departed

class DeliveryRoute(TenantBaseModel):
    __tablename__ = "delivery_routes"

    route_number = Column(String, unique=True, index=True, nullable=False)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False)
    legs_sequence = Column(String, nullable=True)  # JSON serialized destinations list
    total_distance = Column(Float, default=0.0)
    estimated_duration = Column(Float, default=0.0)
    optimized = Column(Boolean, default=True)

class GPSTracking(TenantBaseModel):
    __tablename__ = "gps_tracking"

    vehicle_id = Column(UUID(as_uuid=True), nullable=False)
    shipment_id = Column(UUID(as_uuid=True), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    eta = Column(DateTime, nullable=True)
    status = Column(String, nullable=True)

class ProofOfDelivery(TenantBaseModel):
    __tablename__ = "proof_of_delivery"

    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), unique=True, nullable=False)
    signature_data = Column(String, nullable=True)
    customer_signer_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    photo_path = Column(String, nullable=True)
    otp_code = Column(String, nullable=True)
    remarks = Column(String, nullable=True)

class ReverseLogistics(TenantBaseModel):
    __tablename__ = "reverse_logistics"

    return_number = Column(String, unique=True, index=True, nullable=False)
    original_shipment_id = Column(UUID(as_uuid=True), nullable=True)
    item_code = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    return_reason = Column(String, nullable=True)
    status = Column(String, default="requested")  # requested, package_picked, received, inspected, restocked
    inspection_remarks = Column(String, nullable=True)

class FreightCost(TenantBaseModel):
    __tablename__ = "freight_costs"

    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False)
    fuel_cost = Column(Float, default=0.0)
    toll_cost = Column(Float, default=0.0)
    driver_allowance = Column(Float, default=0.0)
    carrier_charge = Column(Float, default=0.0)
    maintenance_cost_share = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)

class TransportationAnalytics(TenantBaseModel):
    __tablename__ = "transportation_analytics"

    month = Column(String, nullable=False)
    total_shipments = Column(Integer, default=0)
    on_time_percentage = Column(Float, default=100.0)
    failed_deliveries = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)

class FleetPerformance(TenantBaseModel):
    __tablename__ = "fleet_performance"

    vehicle_id = Column(UUID(as_uuid=True), nullable=False)
    total_distance = Column(Float, default=0.0)
    operating_hours = Column(Float, default=0.0)
    fuel_efficiency = Column(Float, default=0.0)
    availability_rate = Column(Float, default=100.0)

class SupplyChainTimeline(TenantBaseModel):
    __tablename__ = "supply_chain_timelines"

    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False)
    event_type = Column(String, nullable=False)  # planned, dispatched, milestone, delay, exceptions, completed
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String, nullable=True)

class SupplyChainAuditLog(TenantBaseModel):
    __tablename__ = "supply_chain_audit_logs"

    user_id = Column(UUID(as_uuid=True), nullable=False)
    email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
