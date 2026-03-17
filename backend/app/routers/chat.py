from fastapi import APIRouter, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.agents import orchestrator
from backend.app.services.providers import get_lenders
from backend.app.database import get_db

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ChatRequest(BaseModel):
    message: str
    gathered_profile: dict = {}
    pending_field: str | None = None


class ChatResponse(BaseModel):
    reply: str
    profile_extracted: dict
    matches_found: int
    matches: list = []
    ready: bool = False
    pending_field: str | None = None


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("50/day")
async def chat(request: Request, body: ChatRequest, db: Session = Depends(get_db)):
    lenders = get_lenders(db)

    result = orchestrator.run(
        message=body.message,
        gathered_profile=body.gathered_profile,
        pending_field=body.pending_field,
        lenders=lenders,
    )

    return ChatResponse(
        reply=result["reply"],
        profile_extracted=result["profile_extracted"],
        matches_found=len(result["matches"]),
        matches=result["matches"],
        ready=result["ready"],
        pending_field=result["pending_field"],
    )
