"""Add inventory tables

Revision ID: 1e3db982736b
Revises: 0b8fda1c481a
Create Date: 2026-07-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: sa.Unicode = '1e3db982736b'
down_revision: Union[str, Sequence[str], None] = '0b8fda1c481a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. inventory_categories
    op.create_table('inventory_categories',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_category_code')
    )
    op.create_index(op.f('ix_inventory_categories_id'), 'inventory_categories', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_categories_tenant_id'), 'inventory_categories', ['tenant_id'], unique=False)

    # 2. warehouses
    op.create_table('warehouses',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('manager_id', sa.UUID(), nullable=True),
    sa.Column('capacity', sa.Float(), nullable=True),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('currency', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['manager_id'], ['employees.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_warehouse_code')
    )
    op.create_index(op.f('ix_warehouses_id'), 'warehouses', ['id'], unique=False)
    op.create_index(op.f('ix_warehouses_tenant_id'), 'warehouses', ['tenant_id'], unique=False)

    # 3. inventory_items
    op.create_table('inventory_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_code', sa.String(), nullable=False),
    sa.Column('sku', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('brand', sa.String(), nullable=True),
    sa.Column('manufacturer', sa.String(), nullable=True),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('category_id', sa.UUID(), nullable=True),
    sa.Column('uom', sa.String(), nullable=False),
    sa.Column('tax_category', sa.String(), nullable=True),
    sa.Column('barcode', sa.String(), nullable=True),
    sa.Column('qr_code', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('min_stock', sa.Float(), nullable=False),
    sa.Column('max_stock', sa.Float(), nullable=False),
    sa.Column('safety_stock', sa.Float(), nullable=False),
    sa.Column('reorder_point', sa.Float(), nullable=False),
    sa.Column('preferred_vendor', sa.String(), nullable=True),
    sa.Column('default_warehouse_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['category_id'], ['inventory_categories.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['default_warehouse_id'], ['warehouses.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'item_code', name='uq_tenant_item_code'),
    sa.UniqueConstraint('tenant_id', 'sku', name='uq_tenant_sku')
    )
    op.create_index(op.f('ix_inventory_items_id'), 'inventory_items', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_items_tenant_id'), 'inventory_items', ['tenant_id'], unique=False)

    # 4. warehouse_locations
    op.create_table('warehouse_locations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('zone', sa.String(), nullable=True),
    sa.Column('aisle', sa.String(), nullable=True),
    sa.Column('rack', sa.String(), nullable=True),
    sa.Column('shelf', sa.String(), nullable=True),
    sa.Column('bin', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'warehouse_id', 'code', name='uq_tenant_location_code')
    )
    op.create_index(op.f('ix_warehouse_locations_id'), 'warehouse_locations', ['id'], unique=False)
    op.create_index(op.f('ix_warehouse_locations_tenant_id'), 'warehouse_locations', ['tenant_id'], unique=False)

    # 5. stock_balances
    op.create_table('stock_balances',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('location_id', sa.UUID(), nullable=True),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('reserved_quantity', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'item_id', 'warehouse_id', 'location_id', name='uq_tenant_item_stock_location')
    )
    op.create_index(op.f('ix_stock_balances_id'), 'stock_balances', ['id'], unique=False)
    op.create_index(op.f('ix_stock_balances_tenant_id'), 'stock_balances', ['tenant_id'], unique=False)

    # 6. stock_movements
    op.create_table('stock_movements',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('location_id', sa.UUID(), nullable=True),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('unit_cost', sa.Float(), nullable=False),
    sa.Column('reference_type', sa.String(), nullable=True),
    sa.Column('reference_id', sa.String(), nullable=True),
    sa.Column('remarks', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_movements_id'), 'stock_movements', ['id'], unique=False)
    op.create_index(op.f('ix_stock_movements_tenant_id'), 'stock_movements', ['tenant_id'], unique=False)

    # 7. stock_batches
    op.create_table('stock_batches',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('batch_number', sa.String(), nullable=False),
    sa.Column('manufacturing_date', sa.DateTime(), nullable=True),
    sa.Column('expiry_date', sa.DateTime(), nullable=True),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('vendor', sa.String(), nullable=True),
    sa.Column('reference_id', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'item_id', 'batch_number', name='uq_tenant_item_batch')
    )
    op.create_index(op.f('ix_stock_batches_id'), 'stock_batches', ['id'], unique=False)
    op.create_index(op.f('ix_stock_batches_tenant_id'), 'stock_batches', ['tenant_id'], unique=False)

    # 8. stock_serials
    op.create_table('stock_serials',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('serial_number', sa.String(), nullable=False),
    sa.Column('purchase_date', sa.DateTime(), nullable=True),
    sa.Column('warranty_expiry', sa.DateTime(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('current_location_id', sa.UUID(), nullable=True),
    sa.Column('assigned_user_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['current_location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'item_id', 'serial_number', name='uq_tenant_item_serial')
    )
    op.create_index(op.f('ix_stock_serials_id'), 'stock_serials', ['id'], unique=False)
    op.create_index(op.f('ix_stock_serials_tenant_id'), 'stock_serials', ['tenant_id'], unique=False)

    # 9. warehouse_tasks
    op.create_table('warehouse_tasks',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('task_type', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('assigned_to_id', sa.UUID(), nullable=True),
    sa.Column('reference_type', sa.String(), nullable=True),
    sa.Column('reference_id', sa.String(), nullable=True),
    sa.Column('remarks', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['assigned_to_id'], ['employees.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_warehouse_tasks_id'), 'warehouse_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_warehouse_tasks_tenant_id'), 'warehouse_tasks', ['tenant_id'], unique=False)

    # 10. inventory_counts
    op.create_table('inventory_counts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('count_date', sa.DateTime(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('approved_by', sa.UUID(), nullable=True),
    sa.Column('approved_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_counts_id'), 'inventory_counts', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_counts_tenant_id'), 'inventory_counts', ['tenant_id'], unique=False)

    # 11. inventory_count_items
    op.create_table('inventory_count_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('count_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('location_id', sa.UUID(), nullable=True),
    sa.Column('system_quantity', sa.Float(), nullable=False),
    sa.Column('counted_quantity', sa.Float(), nullable=False),
    sa.Column('variance', sa.Float(), nullable=False),
    sa.Column('remarks', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['count_id'], ['inventory_counts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_count_items_id'), 'inventory_count_items', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_count_items_tenant_id'), 'inventory_count_items', ['tenant_id'], unique=False)

    # 12. inventory_adjustments
    op.create_table('inventory_adjustments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('location_id', sa.UUID(), nullable=True),
    sa.Column('quantity_adjusted', sa.Float(), nullable=False),
    sa.Column('unit_cost', sa.Float(), nullable=False),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('reason', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('approved_by', sa.UUID(), nullable=True),
    sa.Column('approved_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_adjustments_id'), 'inventory_adjustments', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_adjustments_tenant_id'), 'inventory_adjustments', ['tenant_id'], unique=False)

    # 13. inventory_valuations
    op.create_table('inventory_valuations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('valuation_method', sa.String(), nullable=False),
    sa.Column('unit_cost', sa.Float(), nullable=False),
    sa.Column('total_quantity', sa.Float(), nullable=False),
    sa.Column('total_value', sa.Float(), nullable=False),
    sa.Column('valuation_date', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_valuations_id'), 'inventory_valuations', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_valuations_tenant_id'), 'inventory_valuations', ['tenant_id'], unique=False)

    # 14. reorder_recommendations
    op.create_table('reorder_recommendations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('warehouse_id', sa.UUID(), nullable=False),
    sa.Column('current_stock', sa.Float(), nullable=False),
    sa.Column('safety_stock', sa.Float(), nullable=False),
    sa.Column('reorder_point', sa.Float(), nullable=False),
    sa.Column('recommended_quantity', sa.Float(), nullable=False),
    sa.Column('priority', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reorder_recommendations_id'), 'reorder_recommendations', ['id'], unique=False)
    op.create_index(op.f('ix_reorder_recommendations_tenant_id'), 'reorder_recommendations', ['tenant_id'], unique=False)

    # 15. inventory_forecasts
    op.create_table('inventory_forecasts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('forecast_date', sa.DateTime(), nullable=False),
    sa.Column('forecasted_quantity', sa.Float(), nullable=False),
    sa.Column('confidence_score', sa.Float(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_forecasts_id'), 'inventory_forecasts', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_forecasts_tenant_id'), 'inventory_forecasts', ['tenant_id'], unique=False)

    # 16. inventory_timelines
    op.create_table('inventory_timelines',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('item_id', sa.UUID(), nullable=False),
    sa.Column('event_type', sa.String(), nullable=False),
    sa.Column('details', sa.String(), nullable=True),
    sa.Column('event_date', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('updated_by', sa.String(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_timelines_id'), 'inventory_timelines', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_timelines_tenant_id'), 'inventory_timelines', ['tenant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('inventory_timelines')
    op.drop_table('inventory_forecasts')
    op.drop_table('reorder_recommendations')
    op.drop_table('inventory_valuations')
    op.drop_table('inventory_adjustments')
    op.drop_table('inventory_count_items')
    op.drop_table('inventory_counts')
    op.drop_table('warehouse_tasks')
    op.drop_table('stock_serials')
    op.drop_table('stock_batches')
    op.drop_table('stock_movements')
    op.drop_table('stock_balances')
    op.drop_table('warehouse_locations')
    op.drop_table('inventory_items')
    op.drop_table('warehouses')
    op.drop_table('inventory_categories')
