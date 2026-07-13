from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, List

from app.models.community import Announcement, FeedPost, Poll, PollVote
from app.models.employee import Employee
from app.schemas.community import (
    AnnouncementCreateSchema, FeedPostCreateSchema, PollCreateSchema, PollVoteSchema
)

def serialize_announcement(ann: Announcement) -> dict:
    return {
        "_id": str(ann.id),
        "title": ann.title,
        "content": ann.content,
        "authorId": str(ann.author_id) if ann.author_id else None,
        "isPinned": ann.is_pinned,
        "createdAt": ann.created_at.isoformat()
    }

def serialize_post(post: FeedPost) -> dict:
    return {
        "_id": str(post.id),
        "employeeId": str(post.employee_id),
        "content": post.content,
        "likesCount": post.likes_count,
        "createdAt": post.created_at.isoformat()
    }

def serialize_poll(poll: Poll) -> dict:
    return {
        "_id": str(poll.id),
        "question": poll.question,
        "options": poll.options_json,
        "status": poll.status,
        "votes": [
            {
                "employeeId": str(v.employee_id),
                "selectedOption": v.selected_option
            } for v in poll.votes
        ]
    }

class CommunityService:
    @staticmethod
    def create_announcement(db: Session, payload: AnnouncementCreateSchema, tenant_id: uuid.UUID, author_id: uuid.UUID) -> dict:
        ann = Announcement(
            tenant_id=tenant_id,
            title=payload.title,
            content=payload.content,
            author_id=author_id,
            is_pinned=payload.isPinned
        )
        db.add(ann)
        db.commit()
        db.refresh(ann)
        return serialize_announcement(ann)

    @staticmethod
    def list_announcements(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        announcements = db.query(Announcement).filter(Announcement.tenant_id == tenant_id).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).all()
        return [serialize_announcement(a) for a in announcements]

    @staticmethod
    def create_post(db: Session, payload: FeedPostCreateSchema, tenant_id: uuid.UUID, employee_id: uuid.UUID) -> dict:
        post = FeedPost(
            tenant_id=tenant_id,
            employee_id=employee_id,
            content=payload.content
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return serialize_post(post)

    @staticmethod
    def list_posts(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        posts = db.query(FeedPost).filter(FeedPost.tenant_id == tenant_id).order_by(FeedPost.created_at.desc()).all()
        return [serialize_post(p) for p in posts]

    @staticmethod
    def like_post(db: Session, post_id: str, tenant_id: uuid.UUID) -> dict:
        post_uuid = uuid.UUID(post_id)
        post = db.query(FeedPost).filter(FeedPost.id == post_uuid, FeedPost.tenant_id == tenant_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Feed post not found")
        post.likes_count += 1
        db.commit()
        db.refresh(post)
        return serialize_post(post)

    @staticmethod
    def create_poll(db: Session, payload: PollCreateSchema, tenant_id: uuid.UUID) -> dict:
        poll = Poll(
            tenant_id=tenant_id,
            question=payload.question,
            options_json=payload.optionsJson,
            status="active"
        )
        db.add(poll)
        db.commit()
        db.refresh(poll)
        return serialize_poll(poll)

    @staticmethod
    def list_polls(db: Session, tenant_id: uuid.UUID) -> List[dict]:
        polls = db.query(Poll).filter(Poll.tenant_id == tenant_id).order_by(Poll.created_at.desc()).all()
        return [serialize_poll(p) for p in polls]

    @staticmethod
    def cast_vote(db: Session, poll_id: str, payload: PollVoteSchema, tenant_id: uuid.UUID, employee_id: uuid.UUID) -> dict:
        poll_uuid = uuid.UUID(poll_id)
        poll = db.query(Poll).filter(Poll.id == poll_uuid, Poll.tenant_id == tenant_id).first()
        if not poll:
            raise HTTPException(status_code=404, detail="Poll not found")

        # Verify duplicate vote
        existing = db.query(PollVote).filter(
            PollVote.poll_id == poll_uuid,
            PollVote.employee_id == employee_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="You have already voted on this poll")

        vote = PollVote(
            tenant_id=tenant_id,
            poll_id=poll_uuid,
            employee_id=employee_id,
            selected_option=payload.selectedOption
        )
        db.add(vote)
        db.commit()
        db.refresh(poll)
        return serialize_poll(poll)
