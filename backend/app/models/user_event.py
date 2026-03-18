from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from backend.app.models.lender import Base


class UserEvent(Base):
    __tablename__ = "user_events"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    event_type = Column(String, nullable=False)  # page_view | match_run | chat_message | calculator_used | contact_submitted
    page = Column(String)          # /match, /chat, /calculator, etc.
    session_id = Column(String)    # random ID from frontend (no login required)
    event_meta = Column(JSON)      # extra context: {lender_count, credit_score_range, etc.}
