from typing import Generic, TypeVar, Type, List, Optional, Any
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=Any)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get_by_id(self, db: Session, id: UUID) -> Optional[ModelType]:
        query = db.query(self.model).filter(self.model.id == id)
        # Apply default soft-delete filter if the model has a deleted_at attribute
        if hasattr(self.model, "deleted_at"):
            query = query.filter(self.model.deleted_at == None)
        return query.first()

    def get_all(self, db: Session, tenant_id: Optional[UUID] = None) -> List[ModelType]:
        query = db.query(self.model)
        if tenant_id and hasattr(self.model, "tenant_id"):
            query = query.filter(self.model.tenant_id == tenant_id)
        if hasattr(self.model, "deleted_at"):
            query = query.filter(self.model.deleted_at == None)
        return query.all()

    def create(self, db: Session, obj_in: Any, tenant_id: Optional[UUID] = None, author_id: Optional[UUID] = None) -> ModelType:
        # Convert schema to dict if needed
        if hasattr(obj_in, "model_dump"):
            obj_data = obj_in.model_dump(exclude_unset=True)
        elif hasattr(obj_in, "dict"):
            obj_data = obj_in.dict(exclude_unset=True)
        else:
            obj_data = dict(obj_in)

        db_obj = self.model(**obj_data)
        
        # Set tenant context
        if tenant_id and hasattr(self.model, "tenant_id"):
            db_obj.tenant_id = tenant_id
            
        # Set audit fields
        if author_id:
            if hasattr(self.model, "created_by"):
                db_obj.created_by = author_id
            if hasattr(self.model, "updated_by"):
                db_obj.updated_by = author_id
                
        if hasattr(self.model, "created_at"):
            db_obj.created_at = datetime.utcnow()
        if hasattr(self.model, "updated_at"):
            db_obj.updated_at = datetime.utcnow()

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: Any, author_id: Optional[UUID] = None) -> ModelType:
        if hasattr(obj_in, "model_dump"):
            update_data = obj_in.model_dump(exclude_unset=True)
        elif hasattr(obj_in, "dict"):
            update_data = obj_in.dict(exclude_unset=True)
        else:
            update_data = dict(obj_in)

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        if hasattr(db_obj, "updated_at"):
            db_obj.updated_at = datetime.utcnow()
        if author_id and hasattr(db_obj, "updated_by"):
            db_obj.updated_by = author_id

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: UUID, author_id: Optional[UUID] = None) -> bool:
        # Enforce logical soft delete by default if the model supports it, otherwise do hard delete
        db_obj = db.query(self.model).filter(self.model.id == id).first()
        if not db_obj:
            return False
            
        if hasattr(self.model, "deleted_at"):
            db_obj.deleted_at = datetime.utcnow()
            if author_id and hasattr(db_obj, "deleted_by"):
                db_obj.deleted_by = author_id
            db.add(db_obj)
            db.commit()
        else:
            db.delete(db_obj)
            db.commit()
        return True
