from fastapi import APIRouter, Request, HTTPException, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.services.extractor import extract_borrower_profile, fill_defaults
from backend.app.services.matching import find_matches, explain_matches
from backend.app.database import get_db
from backend.app.models.lender import Lender

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    profile_extracted: dict
    matches_found: int


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/day")
async def chat(request: Request, body: ChatRequest, db: Session = Depends(get_db)):
    # Step 1: Extract profile from natural language
    raw_profile = extract_borrower_profile(body.message)

    if not raw_profile:
        raise HTTPException(status_code=422, detail="Could not understand your message. Please describe your income, credit score, and loan needs.")

    # Step 2: Fill in defaults for missing fields
    profile = fill_defaults(raw_profile)

    # Step 3: Load lenders and run matching
    lenders = db.query(Lender).all()
    lenders_data = [
        {c.name if c.name != "metadata" else "metadata_": getattr(l, c.name if c.name != "metadata" else "metadata_")
         for c in Lender.__table__.columns}
        for l in lenders
    ]

    matches = find_matches(profile, lenders_data, top_k=5)

    if not matches:
        return ChatResponse(
            reply="Based on what you've shared, I wasn't able to find matching lenders. Could you share more details about your credit score, income, or loan purpose?",
            profile_extracted=profile,
            matches_found=0
        )

    # Step 4: Generate conversational response
    explanation = explain_matches(profile, matches)

    top_lenders = ", ".join([m["lender"]["name"] for m in matches[:3]])
    reply = f"Based on your profile, I found {len(matches)} matching lenders.\n\nYour top matches are **{top_lenders}**.\n\n{explanation}"

    return ChatResponse(
        reply=reply,
        profile_extracted=profile,
        matches_found=len(matches)
    )
