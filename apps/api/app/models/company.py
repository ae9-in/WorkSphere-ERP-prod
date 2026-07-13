from sqlalchemy import Column, String
from app.models.base import BaseModel

class Company(BaseModel):
    __tablename__ = "companies"

    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="active", nullable=False) # active, suspended
    industry = Column(String, nullable=True)
    size = Column(String, nullable=True)
    country = Column(String, nullable=True)
    subscription_plan = Column(String, default="free", nullable=False) # free, growth, enterprise
    subscription_status = Column(String, default="active", nullable=False) # active, canceled
