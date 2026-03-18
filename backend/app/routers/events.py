from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user_event import UserEvent

router = APIRouter()


class EventPayload(BaseModel):
    event_type: str   # page_view | match_run | chat_message | calculator_used | contact_submitted
    page: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[dict] = None


@router.post("/events")
def log_event(payload: EventPayload, db: Session = Depends(get_db)):
    event = UserEvent(
        event_type=payload.event_type,
        page=payload.page,
        session_id=payload.session_id,
        metadata=payload.metadata,
    )
    db.add(event)
    db.commit()
    return {"ok": True}
