"""Add supply chain tables

Revision ID: 4e3db982736b
Revises: 3e3db982736b
Create Date: 2026-07-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: sa.Unicode = '4e3db982736b'
down_revision: Union[str, Sequence[str], None] = '3e3db982736b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. supply_chain_network
    op.create_table('supply_chain_network',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('node_code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('node_type', sa.String(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_supply_chain_network_id'), 'supply_chain_network', ['id'], unique=False)
    op.create_index(op.f('ix_supply_chain_network_tenant_id'), 'supply_chain_network', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_supply_chain_network_node_code'), 'supply_chain_network', ['node_code'], unique=True)

    # 2. distribution_centers
    op.create_table('distribution_centers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('center_code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('capacity', sa.Float(), nullable=True),
    sa.Column('manager_name', sa.String(), nullable=True),
    sa.Column('operating_hours', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_distribution_centers_id'), 'distribution_centers', ['id'], unique=False)
    op.create_index(op.f('ix_distribution_centers_tenant_id'), 'distribution_centers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_distribution_centers_center_code'), 'distribution_centers', ['center_code'], unique=True)

    # 3. logistics_partners
    op.create_table('logistics_partners',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('partner_code', sa.String(), nullable=False),
    sa.Column('company_name', sa.String(), nullable=False),
    sa.Column('contact_details', sa.String(), nullable=True),
    sa.Column('service_areas', sa.String(), nullable=True),
    sa.Column('supported_vehicles', sa.String(), nullable=True),
    sa.Column('sla_terms', sa.String(), nullable=True),
    sa.Column('insurance_info', sa.String(), nullable=True),
    sa.Column('performance_rating', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_logistics_partners_id'), 'logistics_partners', ['id'], unique=False)
    op.create_index(op.f('ix_logistics_partners_tenant_id'), 'logistics_partners', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_logistics_partners_partner_code'), 'logistics_partners', ['partner_code'], unique=True)

    # 4. carriers
    op.create_table('carriers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('carrier_code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('carrier_type', sa.String(), nullable=False),
    sa.Column('contract_version', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_carriers_id'), 'carriers', ['id'], unique=False)
    op.create_index(op.f('ix_carriers_tenant_id'), 'carriers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_carriers_carrier_code'), 'carriers', ['carrier_code'], unique=True)

    # 5. fleet_vehicles
    op.create_table('fleet_vehicles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('vehicle_number', sa.String(), nullable=False),
    sa.Column('vehicle_type', sa.String(), nullable=False),
    sa.Column('capacity_weight', sa.Float(), nullable=False),
    sa.Column('capacity_volume', sa.Float(), nullable=False),
    sa.Column('fuel_type', sa.String(), nullable=True),
    sa.Column('gps_device_id', sa.String(), nullable=True),
    sa.Column('driver_id', sa.UUID(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('maintenance_status', sa.String(), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fleet_vehicles_id'), 'fleet_vehicles', ['id'], unique=False)
    op.create_index(op.f('ix_fleet_vehicles_tenant_id'), 'fleet_vehicles', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_fleet_vehicles_vehicle_number'), 'fleet_vehicles', ['vehicle_number'], unique=True)

    # 6. drivers
    op.create_table('drivers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('driver_number', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('license_number', sa.String(), nullable=False),
    sa.Column('license_expiry', sa.DateTime(), nullable=True),
    sa.Column('certifications', sa.String(), nullable=True),
    sa.Column('contact_phone', sa.String(), nullable=True),
    sa.Column('assigned_vehicle_id', sa.UUID(), nullable=True),
    sa.Column('availability_status', sa.String(), nullable=False),
    sa.Column('performance_rating', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_drivers_id'), 'drivers', ['id'], unique=False)
    op.create_index(op.f('ix_drivers_tenant_id'), 'drivers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_drivers_driver_number'), 'drivers', ['driver_number'], unique=True)

    # 7. shipments
    op.create_table('shipments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('shipment_number', sa.String(), nullable=False),
    sa.Column('customer_name', sa.String(), nullable=False),
    sa.Column('warehouse_code', sa.String(), nullable=False),
    sa.Column('destination_address', sa.String(), nullable=False),
    sa.Column('carrier_id', sa.UUID(), nullable=True),
    sa.Column('vehicle_id', sa.UUID(), nullable=True),
    sa.Column('driver_id', sa.UUID(), nullable=True),
    sa.Column('priority', sa.String(), nullable=False),
    sa.Column('delivery_window_start', sa.DateTime(), nullable=True),
    sa.Column('delivery_window_end', sa.DateTime(), nullable=True),
    sa.Column('total_weight', sa.Float(), nullable=True),
    sa.Column('total_volume', sa.Float(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shipments_id'), 'shipments', ['id'], unique=False)
    op.create_index(op.f('ix_shipments_tenant_id'), 'shipments', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_shipments_shipment_number'), 'shipments', ['shipment_number'], unique=True)

    # 8. shipment_items
    op.create_table('shipment_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('item_code', sa.String(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('weight', sa.Float(), nullable=True),
    sa.Column('volume', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shipment_items_id'), 'shipment_items', ['id'], unique=False)
    op.create_index(op.f('ix_shipment_items_tenant_id'), 'shipment_items', ['tenant_id'], unique=False)

    # 9. dispatch_orders
    op.create_table('dispatch_orders',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('dispatch_number', sa.String(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('driver_id', sa.UUID(), nullable=False),
    sa.Column('loading_confirmed_at', sa.DateTime(), nullable=True),
    sa.Column('departure_time', sa.DateTime(), nullable=True),
    sa.Column('expected_arrival', sa.DateTime(), nullable=True),
    sa.Column('gate_pass_number', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dispatch_orders_id'), 'dispatch_orders', ['id'], unique=False)
    op.create_index(op.f('ix_dispatch_orders_tenant_id'), 'dispatch_orders', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_dispatch_orders_dispatch_number'), 'dispatch_orders', ['dispatch_number'], unique=True)

    # 10. delivery_routes
    op.create_table('delivery_routes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('route_number', sa.String(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('legs_sequence', sa.String(), nullable=True),
    sa.Column('total_distance', sa.Float(), nullable=True),
    sa.Column('estimated_duration', sa.Float(), nullable=True),
    sa.Column('optimized', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_delivery_routes_id'), 'delivery_routes', ['id'], unique=False)
    op.create_index(op.f('ix_delivery_routes_tenant_id'), 'delivery_routes', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_delivery_routes_route_number'), 'delivery_routes', ['route_number'], unique=True)

    # 11. gps_tracking
    op.create_table('gps_tracking',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('speed', sa.Float(), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.Column('eta', sa.DateTime(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_gps_tracking_id'), 'gps_tracking', ['id'], unique=False)
    op.create_index(op.f('ix_gps_tracking_tenant_id'), 'gps_tracking', ['tenant_id'], unique=False)

    # 12. proof_of_delivery
    op.create_table('proof_of_delivery',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('signature_data', sa.String(), nullable=True),
    sa.Column('customer_signer_name', sa.String(), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.Column('photo_path', sa.String(), nullable=True),
    sa.Column('otp_code', sa.String(), nullable=True),
    sa.Column('remarks', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('shipment_id')
    )
    op.create_index(op.f('ix_proof_of_delivery_id'), 'proof_of_delivery', ['id'], unique=False)
    op.create_index(op.f('ix_proof_of_delivery_tenant_id'), 'proof_of_delivery', ['tenant_id'], unique=False)

    # 13. reverse_logistics
    op.create_table('reverse_logistics',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('return_number', sa.String(), nullable=False),
    sa.Column('original_shipment_id', sa.UUID(), nullable=True),
    sa.Column('item_code', sa.String(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('return_reason', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('inspection_remarks', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reverse_logistics_id'), 'reverse_logistics', ['id'], unique=False)
    op.create_index(op.f('ix_reverse_logistics_tenant_id'), 'reverse_logistics', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_reverse_logistics_return_number'), 'reverse_logistics', ['return_number'], unique=True)

    # 14. freight_costs
    op.create_table('freight_costs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('fuel_cost', sa.Float(), nullable=True),
    sa.Column('toll_cost', sa.Float(), nullable=True),
    sa.Column('driver_allowance', sa.Float(), nullable=True),
    sa.Column('carrier_charge', sa.Float(), nullable=True),
    sa.Column('maintenance_cost_share', sa.Float(), nullable=True),
    sa.Column('total_cost', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_freight_costs_id'), 'freight_costs', ['id'], unique=False)
    op.create_index(op.f('ix_freight_costs_tenant_id'), 'freight_costs', ['tenant_id'], unique=False)

    # 15. transportation_analytics
    op.create_table('transportation_analytics',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('month', sa.String(), nullable=False),
    sa.Column('total_shipments', sa.Integer(), nullable=True),
    sa.Column('on_time_percentage', sa.Float(), nullable=True),
    sa.Column('failed_deliveries', sa.Integer(), nullable=True),
    sa.Column('total_cost', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transportation_analytics_id'), 'transportation_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_transportation_analytics_tenant_id'), 'transportation_analytics', ['tenant_id'], unique=False)

    # 16. fleet_performance
    op.create_table('fleet_performance',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('total_distance', sa.Float(), nullable=True),
    sa.Column('operating_hours', sa.Float(), nullable=True),
    sa.Column('fuel_efficiency', sa.Float(), nullable=True),
    sa.Column('availability_rate', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fleet_performance_id'), 'fleet_performance', ['id'], unique=False)
    op.create_index(op.f('ix_fleet_performance_tenant_id'), 'fleet_performance', ['tenant_id'], unique=False)

    # 17. supply_chain_timelines
    op.create_table('supply_chain_timelines',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('shipment_id', sa.UUID(), nullable=False),
    sa.Column('event_type', sa.String(), nullable=False),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_supply_chain_timelines_id'), 'supply_chain_timelines', ['id'], unique=False)
    op.create_index(op.f('ix_supply_chain_timelines_tenant_id'), 'supply_chain_timelines', ['tenant_id'], unique=False)

    # 18. supply_chain_audit_logs
    op.create_table('supply_chain_audit_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_supply_chain_audit_logs_id'), 'supply_chain_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_supply_chain_audit_logs_tenant_id'), 'supply_chain_audit_logs', ['tenant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('supply_chain_audit_logs')
    op.drop_table('supply_chain_timelines')
    op.drop_table('fleet_performance')
    op.drop_table('transportation_analytics')
    op.drop_table('freight_costs')
    op.drop_table('reverse_logistics')
    op.drop_table('proof_of_delivery')
    op.drop_table('gps_tracking')
    op.drop_table('delivery_routes')
    op.drop_table('dispatch_orders')
    op.drop_table('shipment_items')
    op.drop_table('shipments')
    op.drop_table('drivers')
    op.drop_table('fleet_vehicles')
    op.drop_table('carriers')
    op.drop_table('logistics_partners')
    op.drop_table('distribution_centers')
    op.drop_table('supply_chain_network')
