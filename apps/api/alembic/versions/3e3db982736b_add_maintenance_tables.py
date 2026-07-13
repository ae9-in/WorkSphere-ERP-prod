"""Add maintenance tables

Revision ID: 3e3db982736b
Revises: 2e3db982736b
Create Date: 2026-07-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: sa.Unicode = '3e3db982736b'
down_revision: Union[str, Sequence[str], None] = '2e3db982736b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. maintenance_assets
    op.create_table('maintenance_assets',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('asset_code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('category', sa.String(), nullable=False),
    sa.Column('manufacturer', sa.String(), nullable=True),
    sa.Column('model', sa.String(), nullable=True),
    sa.Column('serial_number', sa.String(), nullable=True),
    sa.Column('purchase_date', sa.DateTime(), nullable=False),
    sa.Column('installation_date', sa.DateTime(), nullable=False),
    sa.Column('warranty_expiry', sa.DateTime(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('plant_id', sa.UUID(), nullable=True),
    sa.Column('department', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['plant_id'], ['manufacturing_plants.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_assets_id'), 'maintenance_assets', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_assets_tenant_id'), 'maintenance_assets', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_maintenance_assets_asset_code'), 'maintenance_assets', ['asset_code'], unique=False)

    # 2. equipment_master
    op.create_table('equipment_master',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_equipment_master_id'), 'equipment_master', ['id'], unique=False)
    op.create_index(op.f('ix_equipment_master_tenant_id'), 'equipment_master', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_equipment_master_code'), 'equipment_master', ['code'], unique=False)

    # 3. asset_hierarchy
    op.create_table('asset_hierarchy',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('parent_asset_id', sa.UUID(), nullable=True),
    sa.Column('child_asset_id', sa.UUID(), nullable=False),
    sa.Column('relation_type', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['child_asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['parent_asset_id'], ['maintenance_assets.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_asset_hierarchy_id'), 'asset_hierarchy', ['id'], unique=False)
    op.create_index(op.f('ix_asset_hierarchy_tenant_id'), 'asset_hierarchy', ['tenant_id'], unique=False)

    # 4. maintenance_plans
    op.create_table('maintenance_plans',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('plan_number', sa.String(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('maintenance_type', sa.String(), nullable=False),
    sa.Column('frequency', sa.String(), nullable=False),
    sa.Column('checklist', sa.String(), nullable=True),
    sa.Column('estimated_duration', sa.Float(), nullable=False),
    sa.Column('safety_instructions', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_plans_id'), 'maintenance_plans', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_plans_tenant_id'), 'maintenance_plans', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_maintenance_plans_plan_number'), 'maintenance_plans', ['plan_number'], unique=False)

    # 5. maintenance_calendar
    op.create_table('maintenance_calendar',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('plan_id', sa.UUID(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('scheduled_date', sa.DateTime(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['plan_id'], ['maintenance_plans.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_calendar_id'), 'maintenance_calendar', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_calendar_tenant_id'), 'maintenance_calendar', ['tenant_id'], unique=False)

    # 6. maintenance_requests
    op.create_table('maintenance_requests',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('request_number', sa.String(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('requester_email', sa.String(), nullable=False),
    sa.Column('department', sa.String(), nullable=True),
    sa.Column('problem_description', sa.String(), nullable=False),
    sa.Column('priority', sa.String(), nullable=False),
    sa.Column('requested_date', sa.DateTime(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_requests_id'), 'maintenance_requests', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_requests_tenant_id'), 'maintenance_requests', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_maintenance_requests_request_number'), 'maintenance_requests', ['request_number'], unique=False)

    # 7. maintenance_work_orders
    op.create_table('maintenance_work_orders',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_number', sa.String(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('request_id', sa.UUID(), nullable=True),
    sa.Column('plan_id', sa.UUID(), nullable=True),
    sa.Column('maintenance_type', sa.String(), nullable=False),
    sa.Column('assigned_technician_id', sa.UUID(), nullable=True),
    sa.Column('planned_start', sa.DateTime(), nullable=True),
    sa.Column('planned_finish', sa.DateTime(), nullable=True),
    sa.Column('estimated_labor_hours', sa.Float(), nullable=False),
    sa.Column('safety_checklist', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['plan_id'], ['maintenance_plans.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['request_id'], ['maintenance_requests.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_work_orders_id'), 'maintenance_work_orders', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_work_orders_tenant_id'), 'maintenance_work_orders', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_maintenance_work_orders_work_order_number'), 'maintenance_work_orders', ['work_order_number'], unique=False)

    # 8. technician_assignments
    op.create_table('technician_assignments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('technician_id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('skill_name', sa.String(), nullable=False),
    sa.Column('certification_details', sa.String(), nullable=True),
    sa.Column('shift_schedule', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_technician_assignments_id'), 'technician_assignments', ['id'], unique=False)
    op.create_index(op.f('ix_technician_assignments_tenant_id'), 'technician_assignments', ['tenant_id'], unique=False)

    # 9. maintenance_inspections
    op.create_table('maintenance_inspections',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('inspection_number', sa.String(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=True),
    sa.Column('asset_id', sa.UUID(), nullable=False),
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
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_order_id'], ['maintenance_work_orders.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_inspections_id'), 'maintenance_inspections', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_inspections_tenant_id'), 'maintenance_inspections', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_maintenance_inspections_inspection_number'), 'maintenance_inspections', ['inspection_number'], unique=False)

    # 10. inspection_checklists
    op.create_table('inspection_checklists',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('version', sa.String(), nullable=False),
    sa.Column('checklist_data', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inspection_checklists_id'), 'inspection_checklists', ['id'], unique=False)
    op.create_index(op.f('ix_inspection_checklists_tenant_id'), 'inspection_checklists', ['tenant_id'], unique=False)

    # 11. spare_parts_consumption
    op.create_table('spare_parts_consumption',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('quantity_consumed', sa.Float(), nullable=False),
    sa.Column('cost', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['work_order_id'], ['maintenance_work_orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_spare_parts_consumption_id'), 'spare_parts_consumption', ['id'], unique=False)
    op.create_index(op.f('ix_spare_parts_consumption_tenant_id'), 'spare_parts_consumption', ['tenant_id'], unique=False)

    # 12. maintenance_history
    op.create_table('maintenance_history',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('event_type', sa.String(), nullable=False),
    sa.Column('event_date', sa.DateTime(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('cost', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_history_id'), 'maintenance_history', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_history_tenant_id'), 'maintenance_history', ['tenant_id'], unique=False)

    # 13. asset_health
    op.create_table('asset_health',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('date', sa.DateTime(), nullable=False),
    sa.Column('health_score', sa.Float(), nullable=False),
    sa.Column('operating_hours', sa.Float(), nullable=False),
    sa.Column('runtime_hours', sa.Float(), nullable=False),
    sa.Column('downtime_hours', sa.Float(), nullable=False),
    sa.Column('temperature', sa.Float(), nullable=False),
    sa.Column('vibration', sa.Float(), nullable=False),
    sa.Column('power_consumption', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_asset_health_id'), 'asset_health', ['id'], unique=False)
    op.create_index(op.f('ix_asset_health_tenant_id'), 'asset_health', ['tenant_id'], unique=False)

    # 14. predictive_alerts
    op.create_table('predictive_alerts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('alert_date', sa.DateTime(), nullable=False),
    sa.Column('failure_probability', sa.Float(), nullable=False),
    sa.Column('remaining_useful_life_days', sa.Float(), nullable=False),
    sa.Column('recommended_action', sa.String(), nullable=True),
    sa.Column('confidence_score', sa.Float(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_predictive_alerts_id'), 'predictive_alerts', ['id'], unique=False)
    op.create_index(op.f('ix_predictive_alerts_tenant_id'), 'predictive_alerts', ['tenant_id'], unique=False)

    # 15. maintenance_costs
    op.create_table('maintenance_costs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=False),
    sa.Column('labor_cost', sa.Float(), nullable=False),
    sa.Column('parts_cost', sa.Float(), nullable=False),
    sa.Column('downtime_cost', sa.Float(), nullable=False),
    sa.Column('total_cost', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['work_order_id'], ['maintenance_work_orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_costs_id'), 'maintenance_costs', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_costs_tenant_id'), 'maintenance_costs', ['tenant_id'], unique=False)

    # 16. reliability_metrics
    op.create_table('reliability_metrics',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('asset_id', sa.UUID(), nullable=False),
    sa.Column('date', sa.DateTime(), nullable=False),
    sa.Column('mtbf_hours', sa.Float(), nullable=False),
    sa.Column('mttr_hours', sa.Float(), nullable=False),
    sa.Column('availability_rate', sa.Float(), nullable=False),
    sa.Column('failures_count', sa.Integer(), nullable=False),
    sa.Column('total_runtime_hours', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['maintenance_assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reliability_metrics_id'), 'reliability_metrics', ['id'], unique=False)
    op.create_index(op.f('ix_reliability_metrics_tenant_id'), 'reliability_metrics', ['tenant_id'], unique=False)

    # 17. maintenance_analytics
    op.create_table('maintenance_analytics',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('date', sa.DateTime(), nullable=False),
    sa.Column('plant_id', sa.UUID(), nullable=True),
    sa.Column('breakdowns_count', sa.Integer(), nullable=False),
    sa.Column('total_maintenance_cost', sa.Float(), nullable=False),
    sa.Column('labor_hours_logged', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['plant_id'], ['manufacturing_plants.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_analytics_id'), 'maintenance_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_analytics_tenant_id'), 'maintenance_analytics', ['tenant_id'], unique=False)

    # 18. maintenance_timelines
    op.create_table('maintenance_timelines',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('work_order_id', sa.UUID(), nullable=True),
    sa.Column('request_id', sa.UUID(), nullable=True),
    sa.Column('event_type', sa.String(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('event_date', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['request_id'], ['maintenance_requests.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['work_order_id'], ['maintenance_work_orders.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_timelines_id'), 'maintenance_timelines', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_timelines_tenant_id'), 'maintenance_timelines', ['tenant_id'], unique=False)

    # 19. maintenance_audit_logs
    op.create_table('maintenance_audit_logs',
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
    op.create_index(op.f('ix_maintenance_audit_logs_id'), 'maintenance_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_audit_logs_tenant_id'), 'maintenance_audit_logs', ['tenant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('maintenance_audit_logs')
    op.drop_table('maintenance_timelines')
    op.drop_table('maintenance_analytics')
    op.drop_table('reliability_metrics')
    op.drop_table('maintenance_costs')
    op.drop_table('predictive_alerts')
    op.drop_table('asset_health')
    op.drop_table('maintenance_history')
    op.drop_table('spare_parts_consumption')
    op.drop_table('inspection_checklists')
    op.drop_table('maintenance_inspections')
    op.drop_table('technician_assignments')
    op.drop_table('maintenance_work_orders')
    op.drop_table('maintenance_requests')
    op.drop_table('maintenance_calendar')
    op.drop_table('maintenance_plans')
    op.drop_table('asset_hierarchy')
    op.drop_table('equipment_master')
    op.drop_table('maintenance_assets')
