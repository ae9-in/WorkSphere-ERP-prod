from app.repositories.base import BaseRepository
from app.models.document import DocumentModel
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class DocumentRepository(BaseRepository[DocumentModel]):
    def __init__(self):
        super().__init__(DocumentModel)

    def get_documents_by_tenant(self, db: Session, tenant_id: UUID) -> List[DocumentModel]:
        return db.query(DocumentModel).filter(
            DocumentModel.tenant_id == tenant_id,
            DocumentModel.deleted_at == None
        ).all()

    def get_documents_by_employee(self, db: Session, employee_id: UUID, tenant_id: UUID) -> List[DocumentModel]:
        return db.query(DocumentModel).filter(
            DocumentModel.employee_id == employee_id,
            DocumentModel.tenant_id == tenant_id,
            DocumentModel.deleted_at == None
        ).all()
