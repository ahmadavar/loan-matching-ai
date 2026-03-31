from sqlalchemy import Column, Index, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from backend.app.models.lender import Base


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="new")  # new / read / replied

    __table_args__ = (
        Index("ix_contact_requests_created_at", "created_at"),
        Index("ix_contact_requests_status", "status"),
    )
