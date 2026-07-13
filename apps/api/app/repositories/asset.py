from app.repositories.base import BaseRepository
from app.models.asset import Asset, AssetAssignment
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class AssetRepository(BaseRepository[Asset]):
    def __init__(self):
        super().__init__(Asset)

    def get_assets(self, db: Session, tenant_id: UUID) -> List[Asset]:
        return db.query(Asset).filter(
            Asset.tenant_id == tenant_id,
            Asset.deleted_at == None
        ).all()

    def get_assignments(self, db: Session, asset_id: UUID) -> List[AssetAssignment]:
        return db.query(AssetAssignment).filter(
            AssetAssignment.asset_id == asset_id,
            AssetAssignment.deleted_at == None
        ).all()
