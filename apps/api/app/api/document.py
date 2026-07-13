from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.document import DocumentService, DocumentUploadRequest
from typing import Optional

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("", status_code=status.HTTP_201_CREATED)
def upload_document(payload: DocumentUploadRequest, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = DocumentService.upload_document(
        db, payload=payload, tenant_id=tenant_id, author_id=user.id, author_email=user.email
    )
    return {
        "success": True,
        "data": result
    }

@router.get("")
def get_documents(
    category: Optional[str] = None,
    employeeId: Optional[str] = None,
    user: User = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    tenant_id = user.company_id
    result = DocumentService.get_documents(
        db, tenant_id=tenant_id, category=category, employee_id_str=employeeId
    )
    return {
        "success": True,
        "data": result
    }

@router.get("/{id}/download")
def download_document(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    url = DocumentService.download_document(db, doc_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": {"url": url}
    }

@router.patch("/{id}/verify")
def verify_document(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = DocumentService.verify_document(db, doc_id=id, tenant_id=tenant_id, author_id=user.id)
    return {
        "success": True,
        "data": result
    }

@router.delete("/{id}")
def delete_document(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    DocumentService.delete_document(
        db, doc_id=id, tenant_id=tenant_id, author_id=user.id, author_email=user.email
    )
    return {
        "success": True,
        "message": "Document deleted"
    }

@router.get("/expiring")
def get_expiring_documents(days: int = 30, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = DocumentService.get_expiring_documents(db, tenant_id=tenant_id, days=days)
    return {
        "success": True,
        "data": result
    }
