from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_tenant
from app.models.user import User
from app.services.community import CommunityService
from app.schemas.community import (
    AnnouncementCreateSchema, FeedPostCreateSchema, PollCreateSchema, PollVoteSchema
)

router = APIRouter(prefix="/community", tags=["community"])

@router.post("/announcements", status_code=201)
def create_announcement(payload: AnnouncementCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.create_announcement(db, payload=payload, tenant_id=tenant_id, author_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/announcements")
def list_announcements(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.list_announcements(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/posts", status_code=201)
def create_post(payload: FeedPostCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.create_post(db, payload=payload, tenant_id=tenant_id, employee_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/posts")
def list_posts(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.list_posts(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/posts/{id}/like")
def like_post(id: str, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.like_post(db, post_id=id, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/polls", status_code=201)
def create_poll(payload: PollCreateSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.create_poll(db, payload=payload, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.get("/polls")
def list_polls(user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.list_polls(db, tenant_id=tenant_id)
    return {
        "success": True,
        "data": result
    }

@router.post("/polls/{id}/vote")
def cast_vote(id: str, payload: PollVoteSchema, user: User = Depends(verify_tenant), db: Session = Depends(get_db)):
    tenant_id = user.company_id
    result = CommunityService.cast_vote(db, poll_id=id, payload=payload, tenant_id=tenant_id, employee_id=user.employee_id)
    return {
        "success": True,
        "data": result
    }
