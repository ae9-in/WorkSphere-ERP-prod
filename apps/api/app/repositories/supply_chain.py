from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.models.supply_chain import (
    SupplyChainNetwork, DistributionCenter, LogisticsPartner, Carrier,
    FleetVehicle, Driver, Shipment, ShipmentItem, DispatchOrder,
    DeliveryRoute, GPSTracking, ProofOfDelivery, ReverseLogistics,
    FreightCost, TransportationAnalytics, FleetPerformance,
    SupplyChainTimeline, SupplyChainAuditLog
)

class SupplyChainNetworkRepository:
    def get_by_code(self, db: Session, code: str, tenant_id: uuid.UUID) -> Optional[SupplyChainNetwork]:
        return db.query(SupplyChainNetwork).filter(
            SupplyChainNetwork.node_code == code,
            SupplyChainNetwork.tenant_id == tenant_id,
            SupplyChainNetwork.deleted_at == None
        ).first()

class DistributionCenterRepository:
    def get_by_code(self, db: Session, code: str, tenant_id: uuid.UUID) -> Optional[DistributionCenter]:
        return db.query(DistributionCenter).filter(
            DistributionCenter.center_code == code,
            DistributionCenter.tenant_id == tenant_id,
            DistributionCenter.deleted_at == None
        ).first()

class LogisticsPartnerRepository:
    def get_by_code(self, db: Session, code: str, tenant_id: uuid.UUID) -> Optional[LogisticsPartner]:
        return db.query(LogisticsPartner).filter(
            LogisticsPartner.partner_code == code,
            LogisticsPartner.tenant_id == tenant_id,
            LogisticsPartner.deleted_at == None
        ).first()

class CarrierRepository:
    def get_by_code(self, db: Session, code: str, tenant_id: uuid.UUID) -> Optional[Carrier]:
        return db.query(Carrier).filter(
            Carrier.carrier_code == code,
            Carrier.tenant_id == tenant_id,
            Carrier.deleted_at == None
        ).first()

class FleetVehicleRepository:
    def get_by_number(self, db: Session, number: str, tenant_id: uuid.UUID) -> Optional[FleetVehicle]:
        return db.query(FleetVehicle).filter(
            FleetVehicle.vehicle_number == number,
            FleetVehicle.tenant_id == tenant_id,
            FleetVehicle.deleted_at == None
        ).first()

    def get(self, db: Session, vehicle_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[FleetVehicle]:
        return db.query(FleetVehicle).filter(
            FleetVehicle.id == vehicle_id,
            FleetVehicle.tenant_id == tenant_id,
            FleetVehicle.deleted_at == None
        ).first()

class DriverRepository:
    def get_by_number(self, db: Session, number: str, tenant_id: uuid.UUID) -> Optional[Driver]:
        return db.query(Driver).filter(
            Driver.driver_number == number,
            Driver.tenant_id == tenant_id,
            Driver.deleted_at == None
        ).first()

    def get(self, db: Session, driver_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[Driver]:
        return db.query(Driver).filter(
            Driver.id == driver_id,
            Driver.tenant_id == tenant_id,
            Driver.deleted_at == None
        ).first()

class ShipmentRepository:
    def get_by_number(self, db: Session, number: str, tenant_id: uuid.UUID) -> Optional[Shipment]:
        return db.query(Shipment).filter(
            Shipment.shipment_number == number,
            Shipment.tenant_id == tenant_id,
            Shipment.deleted_at == None
        ).first()

    def get(self, db: Session, shipment_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[Shipment]:
        return db.query(Shipment).filter(
            Shipment.id == shipment_id,
            Shipment.tenant_id == tenant_id,
            Shipment.deleted_at == None
        ).first()

class DispatchOrderRepository:
    def get_by_number(self, db: Session, number: str, tenant_id: uuid.UUID) -> Optional[DispatchOrder]:
        return db.query(DispatchOrder).filter(
            DispatchOrder.dispatch_number == number,
            DispatchOrder.tenant_id == tenant_id,
            DispatchOrder.deleted_at == None
        ).first()

class DeliveryRouteRepository:
    def get_by_shipment(self, db: Session, shipment_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[DeliveryRoute]:
        return db.query(DeliveryRoute).filter(
            DeliveryRoute.shipment_id == shipment_id,
            DeliveryRoute.tenant_id == tenant_id,
            DeliveryRoute.deleted_at == None
        ).first()

class GPSTrackingRepository:
    def get_history(self, db: Session, shipment_id: uuid.UUID, tenant_id: uuid.UUID) -> List[GPSTracking]:
        return db.query(GPSTracking).filter(
            GPSTracking.shipment_id == shipment_id,
            GPSTracking.tenant_id == tenant_id
        ).order_by(GPSTracking.timestamp.desc()).all()

class ProofOfDeliveryRepository:
    def get_by_shipment(self, db: Session, shipment_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[ProofOfDelivery]:
        return db.query(ProofOfDelivery).filter(
            ProofOfDelivery.shipment_id == shipment_id,
            ProofOfDelivery.tenant_id == tenant_id
        ).first()

class ReverseLogisticsRepository:
    def get_by_number(self, db: Session, number: str, tenant_id: uuid.UUID) -> Optional[ReverseLogistics]:
        return db.query(ReverseLogistics).filter(
            ReverseLogistics.return_number == number,
            ReverseLogistics.tenant_id == tenant_id,
            ReverseLogistics.deleted_at == None
        ).first()

class FreightCostRepository:
    def get_by_shipment(self, db: Session, shipment_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[FreightCost]:
        return db.query(FreightCost).filter(
            FreightCost.shipment_id == shipment_id,
            FreightCost.tenant_id == tenant_id
        ).first()
