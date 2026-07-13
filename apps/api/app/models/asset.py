from sqlalchemy import Column, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.models.base import TenantBaseModel

class Asset(TenantBaseModel):
    __tablename__ = "assets"

    category = Column(String, nullable=False) # laptop, desktop, phone, sim, access_card, software, other
    name = Column(String, nullable=False)
    asset_tag = Column(String, nullable=False)
    serial_number = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    purchase_date = Column(DateTime, nullable=True)
    purchase_price = Column(Float, nullable=True)
    warranty_expiry = Column(DateTime, nullable=True)
    status = Column(String, default="available", nullable=False) # available, assigned, maintenance, retired, lost
    current_employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    condition = Column(String, default="new", nullable=False) # new, good, fair, damaged
    notes = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("tenant_id", "asset_tag", name="uq_tenant_asset_tag"),
    )


class AssetAssignment(TenantBaseModel):
    __tablename__ = "asset_assignments"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String, nullable=False)
    asset_name = Column(String, nullable=False)
    serial_number = Column(String, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="assigned", nullable=False) # assigned, returned
