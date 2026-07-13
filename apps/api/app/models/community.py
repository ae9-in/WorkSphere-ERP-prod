import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from datetime import datetime
from app.models.base import TenantBaseModel

class Announcement(TenantBaseModel):
    __tablename__ = "community_announcements"

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)

class FeedPost(TenantBaseModel):
    __tablename__ = "community_posts"

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(String, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)

class Poll(TenantBaseModel):
    __tablename__ = "community_polls"

    question = Column(String, nullable=False)
    options_json = Column(JSON, default=list, nullable=False) # list of string options
    status = Column(String, default="active", nullable=False) # active, closed

    votes = orm_relationship("PollVote", back_populates="poll", cascade="all, delete-orphan")

class PollVote(TenantBaseModel):
    __tablename__ = "community_poll_votes"

    poll_id = Column(UUID(as_uuid=True), ForeignKey("community_polls.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option = Column(String, nullable=False)

    poll = orm_relationship("Poll", back_populates="votes")
