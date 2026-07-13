"""Add manufacturing tables

Revision ID: 2e3db982736b
Revises: 1e3db982736b
Create Date: 2026-07-13 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: sa.Unicode = '2e3db982736b'
down_revision: Union[str, Sequence[str], None] = '1e3db982736b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. manufacturing_plants
    op.create_table('manufacturing_plants',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('manager_id', sa.UUID(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_plant_code')
    )
    op.create_index(op.f('ix_manufacturing_plants_id'), 'manufacturing_plants', ['id'], unique=False)
    op.create_index(op.f('ix_manufacturing_plants_tenant_id'), 'manufacturing_plants', ['tenant_id'], unique=False)

    # 2. production_calendars
    op.create_table('production_calendars',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('plant_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('working_days', sa.String(), nullable=True),
    sa.Column('shifts', sa.String(), nullable=True),
    sa.Column('holidays', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['plant_id'], ['manufacturing_plants.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_production_calendars_id'), 'production_calendars', ['id'], unique=False)
    op.create_index(op.f('ix_production_calendars_tenant_id'), 'production_calendars', ['tenant_id'], unique=False)

    # 3. work_centers
    op.create_table('work_centers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('department', sa.String(), nullable=True),
    sa.Column('capacity', sa.Float(), nullable=False),
    sa.Column('shift_schedule', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_work_center_code')
    )
    op.create_index(op.f('ix_work_centers_id'), 'work_centers', ['id'], unique=False)
    op.create_index(op.f('ix_work_centers_tenant_id'), 'work_centers', ['tenant_id'], unique=False)

    # 4. machines
    op.create_table('machines',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('machine_code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('equipment_type', sa.String(), nullable=True),
    sa.Column('manufacturer', sa.String(), nullable=True),
    sa.Column('installation_date', sa.DateTime(), nullable=False),
    sa.Column('maintenance_schedule', sa.String(), nullable=True),
    sa.Column('calibration_status', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('utilization_rate', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'machine_code', name='uq_tenant_machine_code')
    )
    op.create_index(op.f('ix_machines_id'), 'machines', ['id'], unique=False)
    op.create_index(op.f('ix_machines_tenant_id'), 'machines', ['tenant_id'], unique=False)

    # 5. bill_of_materials
    op.create_table('bill_of_materials',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('bom_number', sa.String(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('version', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'bom_number', name='uq_tenant_bom_number')
    )
    op.create_index(op.f('ix_bill_of_materials_id'), 'bill_of_materials', ['id'], unique=False)
    op.create_index(op.f('ix_bill_of_materials_tenant_id'), 'bill_of_materials', ['tenant_id'], unique=False)

    # 6. bom_components
    op.create_table('bom_components',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('bom_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('uom', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bom_components_id'), 'bom_components', ['id'], unique=False)
    op.create_index(op.f('ix_bom_components_tenant_id'), 'bom_components', ['tenant_id'], unique=False)

    # 7. routing_master
    op.create_table('routing_master',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('version', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_routing_code')
    )
    op.create_index(op.f('ix_routing_master_id'), 'routing_master', ['id'], unique=False)
    op.create_index(op.f('ix_routing_master_tenant_id'), 'routing_master', ['tenant_id'], unique=False)

    # 8. routing_operations
    op.create_table('routing_operations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('routing_id', sa.UUID(), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('work_center_id', sa.UUID(), nullable=False),
    sa.Column('machine_id', sa.UUID(), nullable=True),
    sa.Column('standard_time', sa.Float(), nullable=False),
    sa.Column('setup_time', sa.Float(), nullable=False),
    sa.Column('labor_time', sa.Float(), nullable=False),
    sa.Column('is_inspection_point', sa.Boolean(), nullable=False),
    sa.Column('output_quantity', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['routing_id'], ['routing_master.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_center_id'], ['work_centers.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routing_operations_id'), 'routing_operations', ['id'], unique=False)
    op.create_index(op.f('ix_routing_operations_tenant_id'), 'routing_operations', ['tenant_id'], unique=False)

    # 9. production_orders
    op.create_table('production_orders',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('order_number', sa.String(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('bom_id', sa.UUID(), nullable=False),
    sa.Column('routing_id', sa.UUID(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('planned_start', sa.DateTime(), nullable=True),
    sa.Column('planned_finish', sa.DateTime(), nullable=True),
    sa.Column('plant_id', sa.UUID(), nullable=False),
    sa.Column('work_center_id', sa.UUID(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['plant_id'], ['manufacturing_plants.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['routing_id'], ['routing_master.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_center_id'], ['work_centers.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'order_number', name='uq_tenant_production_order_number')
    )
    op.create_index(op.f('ix_production_orders_id'), 'production_orders', ['id'], unique=False)
    op.create_index(op.f('ix_production_orders_tenant_id'), 'production_orders', ['tenant_id'], unique=False)

    # 10. work_orders
    op.create_table('work_orders',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_number', sa.String(), nullable=False),
    sa.Column('production_order_id', sa.UUID(), nullable=False),
    sa.Column('bom_id', sa.UUID(), nullable=False),
    sa.Column('routing_id', sa.UUID(), nullable=False),
    sa.Column('work_center_id', sa.UUID(), nullable=False),
    sa.Column('machine_id', sa.UUID(), nullable=True),
    sa.Column('operator_id', sa.UUID(), nullable=True),
    sa.Column('planned_quantity', sa.Float(), nullable=False),
    sa.Column('produced_quantity', sa.Float(), nullable=False),
    sa.Column('scrap_quantity', sa.Float(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['routing_id'], ['routing_master.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_center_id'], ['work_centers.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'work_order_number', name='uq_tenant_work_order_number')
    )
    op.create_index(op.f('ix_work_orders_id'), 'work_orders', ['id'], unique=False)
    op.create_index(op.f('ix_work_orders_tenant_id'), 'work_orders', ['tenant_id'], unique=False)

    # 11. material_consumption
    op.create_table('material_consumption',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('batch_number', sa.String(), nullable=True),
    sa.Column('serial_number', sa.String(), nullable=True),
    sa.Column('quantity_consumed', sa.Float(), nullable=False),
    sa.Column('waste_quantity', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_consumption_id'), 'material_consumption', ['id'], unique=False)
    op.create_index(op.f('ix_material_consumption_tenant_id'), 'material_consumption', ['tenant_id'], unique=False)

    # 12. work_in_progress
    op.create_table('work_in_progress',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=False),
    sa.Column('current_operation_seq', sa.Integer(), nullable=False),
    sa.Column('quantity_completed', sa.Float(), nullable=False),
    sa.Column('quantity_remaining', sa.Float(), nullable=False),
    sa.Column('material_cost', sa.Float(), nullable=False),
    sa.Column('labor_hours', sa.Float(), nullable=False),
    sa.Column('machine_hours', sa.Float(), nullable=False),
    sa.Column('estimated_completion', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_work_in_progress_id'), 'work_in_progress', ['id'], unique=False)
    op.create_index(op.f('ix_work_in_progress_tenant_id'), 'work_in_progress', ['tenant_id'], unique=False)

    # 13. production_output
    op.create_table('production_output',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('good_quantity', sa.Float(), nullable=False),
    sa.Column('scrap_quantity', sa.Float(), nullable=False),
    sa.Column('rejected_quantity', sa.Float(), nullable=False),
    sa.Column('location_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_production_output_id'), 'production_output', ['id'], unique=False)
    op.create_index(op.f('ix_production_output_tenant_id'), 'production_output', ['tenant_id'], unique=False)

    # 14. quality_inspections
    op.create_table('quality_inspections',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('inspection_number', sa.String(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=True),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('stage', sa.String(), nullable=False),
    sa.Column('result', sa.String(), nullable=False),
    sa.Column('inspector_email', sa.String(), nullable=False),
    sa.Column('inspection_date', sa.DateTime(), nullable=False),
    sa.Column('criteria', sa.String(), nullable=True),
    sa.Column('remarks', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'inspection_number', name='uq_tenant_inspection_number')
    )
    op.create_index(op.f('ix_quality_inspections_id'), 'quality_inspections', ['id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_tenant_id'), 'quality_inspections', ['tenant_id'], unique=False)

    # 15. non_conformance_reports
    op.create_table('non_conformance_reports',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('ncr_number', sa.String(), nullable=False),
    sa.Column('inspection_id', sa.UUID(), nullable=False),
    sa.Column('defect_details', sa.String(), nullable=False),
    sa.Column('root_cause', sa.String(), nullable=True),
    sa.Column('corrective_action', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['inspection_id'], ['quality_inspections.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'ncr_number', name='uq_tenant_ncr_number')
    )
    op.create_index(op.f('ix_non_conformance_reports_id'), 'non_conformance_reports', ['id'], unique=False)
    op.create_index(op.f('ix_non_conformance_reports_tenant_id'), 'non_conformance_reports', ['tenant_id'], unique=False)

    # 16. scrap_records
    op.create_table('scrap_records',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('scrap_number', sa.String(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=True),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('scrap_category', sa.String(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('cost', sa.Float(), nullable=False),
    sa.Column('reason', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'scrap_number', name='uq_tenant_scrap_number')
    )
    op.create_index(op.f('ix_scrap_records_id'), 'scrap_records', ['id'], unique=False)
    op.create_index(op.f('ix_scrap_records_tenant_id'), 'scrap_records', ['tenant_id'], unique=False)

    # 17. machine_performance
    op.create_table('machine_performance',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('machine_id', sa.UUID(), nullable=False),
    sa.Column('date', sa.DateTime(), nullable=False),
    sa.Column('runtime', sa.Float(), nullable=False),
    sa.Column('downtime', sa.Float(), nullable=False),
    sa.Column('idle_time', sa.Float(), nullable=False),
    sa.Column('maintenance_time', sa.Float(), nullable=False),
    sa.Column('availability_rate', sa.Float(), nullable=False),
    sa.Column('performance_rate', sa.Float(), nullable=False),
    sa.Column('quality_rate', sa.Float(), nullable=False),
    sa.Column('oee', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_machine_performance_id'), 'machine_performance', ['id'], unique=False)
    op.create_index(op.f('ix_machine_performance_tenant_id'), 'machine_performance', ['tenant_id'], unique=False)

    # 18. production_analytics
    op.create_table('production_analytics',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('plant_id', sa.UUID(), nullable=True),
    sa.Column('date', sa.DateTime(), nullable=False),
    sa.Column('daily_demand', sa.Float(), nullable=False),
    sa.Column('daily_production_volume', sa.Float(), nullable=False),
    sa.Column('yield_rate', sa.Float(), nullable=False),
    sa.Column('scrap_rate', sa.Float(), nullable=False),
    sa.Column('throughput_rate', sa.Float(), nullable=False),
    sa.Column('labor_productivity', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['plant_id'], ['manufacturing_plants.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_production_analytics_id'), 'production_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_production_analytics_tenant_id'), 'production_analytics', ['tenant_id'], unique=False)

    # 19. manufacturing_timelines
    op.create_table('manufacturing_timelines',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('production_order_id', sa.UUID(), nullable=True),
    sa.Column('work_order_id', sa.UUID(), nullable=True),
    sa.Column('event_type', sa.String(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('event_date', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_manufacturing_timelines_id'), 'manufacturing_timelines', ['id'], unique=False)
    op.create_index(op.f('ix_manufacturing_timelines_tenant_id'), 'manufacturing_timelines', ['tenant_id'], unique=False)

    # 20. manufacturing_audit_logs
    op.create_table('manufacturing_audit_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('details', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_manufacturing_audit_logs_id'), 'manufacturing_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_manufacturing_audit_logs_tenant_id'), 'manufacturing_audit_logs', ['tenant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('manufacturing_audit_logs')
    op.drop_table('manufacturing_timelines')
    op.drop_table('production_analytics')
    op.drop_table('machine_performance')
    op.drop_table('scrap_records')
    op.drop_table('non_conformance_reports')
    op.drop_table('quality_inspections')
    op.drop_table('production_output')
    op.drop_table('work_in_progress')
    op.drop_table('material_consumption')
    op.drop_table('work_orders')
    op.drop_table('production_orders')
    op.drop_table('routing_operations')
    op.drop_table('routing_master')
    op.drop_table('bom_components')
    op.drop_table('bill_of_materials')
    op.drop_table('machines')
    op.drop_table('work_centers')
    op.drop_table('production_calendars')
    op.drop_table('manufacturing_plants')
