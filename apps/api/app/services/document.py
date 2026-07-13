from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import uuid
from typing import Optional, Dict, Any, List

from app.repositories.document import DocumentRepository
from app.models.document import DocumentModel
from app.models.audit import AuditLog
from pydantic import BaseModel

document_repo = DocumentRepository()

class DocumentUploadRequest(BaseModel):
    name: str
    category: str
    employeeId: Optional[str] = None
    size: Optional[int] = 1024
    mimeType: Optional[str] = "application/pdf"
    expiryDate: Optional[str] = None
    url: Optional[str] = None

class DocumentService:
    @staticmethod
    def upload_document(db: Session, payload: DocumentUploadRequest, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> dict:
        emp_uuid = None
        if payload.employeeId:
            emp_uuid = uuid.UUID(payload.employeeId)

        exp_date = None
        if payload.expiryDate:
            try:
                exp_date = datetime.strptime(payload.expiryDate, "%Y-%m-%d")
            except Exception:
                pass

        doc = DocumentModel(
            tenant_id=tenant_id,
            employee_id=emp_uuid,
            category=payload.category,
            type=payload.mimeType.split("/")[-1] if payload.mimeType and "/" in payload.mimeType else "pdf",
            name=payload.name,
            url=payload.url or "https://placeholder-doc.pdf",
            size=payload.size or 1024,
            mime_type=payload.mimeType or "application/pdf",
            expiry_date=exp_date,
            uploaded_by=str(author_id),
            status="pending"
        )
        db.add(doc)

        if emp_uuid:
            from app.services.timeline import TimelineService
            TimelineService.log_event(
                db=db,
                tenant_id=tenant_id,
                employee_id=emp_uuid,
                event_type="DOCUMENT_UPLOADED",
                title="Document Uploaded",
                description=f"Document '{payload.name}' ({payload.category}) was uploaded.",
                performed_by=author_email
            )

        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="DOCUMENT_UPLOADED",
            details=f"Uploaded document {payload.name} to category {payload.category}"
        )
        db.add(audit)
        db.commit()
        db.refresh(doc)
        return {"id": str(doc.id), "name": doc.name, "category": doc.category, "url": doc.url}

    @staticmethod
    def get_documents(db: Session, tenant_id: uuid.UUID, category: Optional[str], employee_id_str: Optional[str]) -> List[dict]:
        query = db.query(DocumentModel).filter(DocumentModel.tenant_id == tenant_id, DocumentModel.deleted_at == None)
        
        if category:
            query = query.filter(DocumentModel.category == category)
        if employee_id_str:
            query = query.filter(DocumentModel.employee_id == uuid.UUID(employee_id_str))

        docs = query.order_by(DocumentModel.uploaded_at.desc()).all()
        formatted = []
        for d in docs:
            formatted.append({
                "id": str(d.id),
                "employeeId": str(d.employee_id) if d.employee_id else None,
                "category": d.category,
                "type": d.type,
                "name": d.name,
                "version": d.version,
                "url": d.url,
                "size": d.size,
                "mimeType": d.mime_type,
                "expiryDate": d.expiry_date.strftime("%Y-%m-%d") if d.expiry_date else None,
                "uploadedBy": d.uploaded_by,
                "uploadedAt": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "status": d.status
            })
        return formatted

    @staticmethod
    def download_document(db: Session, doc_id: str, tenant_id: uuid.UUID) -> str:
        doc_uuid = uuid.UUID(doc_id)
        doc = db.query(DocumentModel).filter(DocumentModel.id == doc_uuid, DocumentModel.tenant_id == tenant_id, DocumentModel.deleted_at == None).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc.url

    @staticmethod
    def verify_document(db: Session, doc_id: str, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        doc_uuid = uuid.UUID(doc_id)
        doc = db.query(DocumentModel).filter(DocumentModel.id == doc_uuid, DocumentModel.tenant_id == tenant_id, DocumentModel.deleted_at == None).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        doc.verified_by = str(author_id)
        doc.verified_at = datetime.utcnow()
        doc.status = "verified"
        db.commit()
        return {"id": str(doc.id), "status": doc.status}

    @staticmethod
    def delete_document(db: Session, doc_id: str, tenant_id: uuid.UUID, author_id: uuid.UUID, author_email: str) -> bool:
        doc_uuid = uuid.UUID(doc_id)
        doc = db.query(DocumentModel).filter(DocumentModel.id == doc_uuid, DocumentModel.tenant_id == tenant_id, DocumentModel.deleted_at == None).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Soft delete inside service
        doc.deleted_at = datetime.utcnow()
        doc.deleted_by = str(author_id)
        
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=author_id,
            email=author_email,
            action="DOCUMENT_DELETED",
            details=f"Soft deleted document ID {doc_id}"
        )
        db.add(audit)
        db.commit()
        return True

    @staticmethod
    def get_expiring_documents(db: Session, tenant_id: uuid.UUID, days: int) -> List[dict]:
        now = datetime.utcnow()
        threshold = now + timedelta(days=days)

        docs = db.query(DocumentModel).filter(
            DocumentModel.tenant_id == tenant_id,
            DocumentModel.expiry_date >= now,
            DocumentModel.expiry_date <= threshold,
            DocumentModel.deleted_at == None
        ).all()

        formatted = []
        for d in docs:
            formatted.append({
                "id": str(d.id),
                "name": d.name,
                "category": d.category,
                "expiryDate": d.expiry_date.strftime("%Y-%m-%d")
            })
        return formatted
