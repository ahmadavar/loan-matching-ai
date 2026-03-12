from fastapi import APIRouter, Request, HTTPException, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.services.extractor import extract_borrower_profile, fill_defaults
from backend.app.services.matching import find_matches, explain_matches
from backend.app.services.providers import get_lenders
from backend.app.database import get_db

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Fields collected in order — required first, then optional but helpful
REQUIRED_FIELDS = [
    "loan_amount_needed",
    "loan_purpose",
    "credit_score",
    "employment_type",
    "annual_income",
    "monthly_debt_payments",
    "years_at_current_work",
    "total_assets",
]

# Fun follow-up questions for each missing field
FOLLOW_UPS = {
    "loan_amount_needed": (
        "Hey, happy to help you find the right lender. How much are you looking to borrow?"
    ),
    "loan_purpose": (
        "What's the loan for?\n\n"
        "*(medical, car, home project, debt payoff, business, education, or something else?)*"
    ),
    "credit_score": (
        "Roughly what's your credit score? No judgment here — it just helps me find lenders who are actually a good fit.\n\n"
        "- **Excellent** — 750+\n"
        "- **Good** — 700–749\n"
        "- **Fair** — 650–699\n"
        "- **Needs work** — below 650"
    ),
    "employment_type": (
        "What kind of work do you do?\n\n"
        "- Regular **salaried** job\n"
        "- **Self-employed** or freelancer\n"
        "- **Gig work** (Uber, DoorDash, Fiverr, etc.)\n"
        "- **Contractor** / 1099"
    ),
    "annual_income": (
        "Roughly what's your annual income? A ballpark is totally fine — no tax returns needed."
    ),
    "monthly_debt_payments": (
        "Do you have any existing monthly debt payments? Think credit cards, car loan, student loans. "
        "Just say $0 if none."
    ),
    "years_at_current_work": (
        "How long have you been in your current job or line of work? "
        "*(e.g. 6 months, 2 years, 5+ years)*"
    ),
    "total_assets": (
        "Last one — do you have any savings, investments, or property? "
        "A rough total works, or just say $0 if not applicable."
    ),
}

# Acknowledgements when a field is just captured — makes it feel conversational
ACKNOWLEDGEMENTS = {
    "loan_purpose": ["Got it.", "Makes sense.", "Good to know."],
    "credit_score": ["Got it.", "Thanks.", "Noted."],
    "employment_type": ["Got it.", "Makes sense.", "Good to know."],
    "annual_income": ["Got it.", "Thanks.", "Noted."],
    "monthly_debt_payments": ["Got it.", "Noted.", "Thanks."],
}


def get_ack(field: str, index: int = 0) -> str:
    options = ACKNOWLEDGEMENTS.get(field, ["Got it!"])
    return options[index % len(options)]


class ChatRequest(BaseModel):
    message: str
    gathered_profile: dict = {}   # Fields collected so far across conversation turns
    pending_field: str | None = None  # The field we just asked about


class ChatResponse(BaseModel):
    reply: str
    profile_extracted: dict   # Current state of gathered profile
    matches_found: int
    matches: list = []
    ready: bool = False       # True when matching was run
    pending_field: str | None = None  # Next field we're asking about


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("50/day")
async def chat(request: Request, body: ChatRequest, db: Session = Depends(get_db)):
    # If user wants to restart (e.g. after no-match "want to adjust?"), clear profile
    restart_phrases = ["yes", "yeah", "sure", "adjust", "try again", "restart", "reset", "start over", "yep", "ok", "okay"]
    if body.pending_field == "restart" and any(p in body.message.lower() for p in restart_phrases):
        return ChatResponse(
            reply="No problem! Let's try again. How much are you looking to borrow?",
            profile_extracted={},
            matches_found=0,
            ready=False,
            pending_field="loan_amount_needed",
        )

    # Step 1: Extract whatever the user mentioned in this message
    # Pass pending_field so extractor knows what question was just asked
    new_fields = extract_borrower_profile(body.message, pending_field=body.pending_field)

    # Step 2: Merge with previously gathered fields
    # Rule: only update if extractor found a non-null value
    merged = dict(body.gathered_profile)
    last_filled = None
    if new_fields:
        for k, v in new_fields.items():
            if v is not None and merged.get(k) is None:
                merged[k] = v
                last_filled = k  # Track the last field we just filled

    # Step 3: Check which required fields are still missing
    missing = [f for f in REQUIRED_FIELDS if merged.get(f) is None]

    # Step 4: If fields still missing → ask for the next one
    if missing:
        next_field = missing[0]
        follow_up = FOLLOW_UPS[next_field]

        # If we just filled a field, acknowledge it warmly before asking next question
        if last_filled and last_filled != next_field:
            ack = get_ack(last_filled)
            reply = f"{ack} {follow_up}"
        else:
            reply = follow_up

        return ChatResponse(
            reply=reply,
            profile_extracted=merged,
            matches_found=0,
            matches=[],
            ready=False,
            pending_field=next_field,
        )

    # Step 5: All required fields collected — run matching
    profile = fill_defaults(merged)

    # Handle unemployed / zero income edge case
    if profile.get("employment_type") == "unemployed" or profile.get("annual_income", 0) == 0:
        reply = (
            "Thanks for sharing all that. Unfortunately, lenders require an active income source to approve a loan. "
            "Without verifiable income, none of the lenders in our network can match you right now.\n\n"
            "**A few options worth knowing about:**\n"
            "- Come back once you have employment or a documented income source\n"
            "- Check out **Kiva** — they offer 0% interest microloans and weigh character over income\n"
            "- Look into government assistance programs for your situation"
        )
        return ChatResponse(reply=reply, profile_extracted=profile, matches_found=0, ready=True)

    lenders_data = get_lenders(db)
    matches = find_matches(profile, lenders_data, top_k=5)

    if not matches:
        reply = (
            f"I ran your profile against all {len(lenders_data)} lenders and unfortunately none were a strong fit right now. "
            "The most common reasons are credit score, income level, or DTI ratio. "
            "Want to adjust any of your details and try again?"
        )
        return ChatResponse(reply=reply, profile_extracted=profile, matches_found=0, ready=False, pending_field="restart")

    explanation = explain_matches(profile, matches)
    top_lenders = ", ".join([m["lender"]["name"] for m in matches[:3]])
    reply = (
        f"Matched you against **{len(lenders_data)} lenders**. Here are your top results.\n\n"
        f"Best fits: **{top_lenders}**.\n\n"
        f"{explanation}"
    )

    matches_out = [
        {
            "lender_name": m["lender"]["name"],
            "score": m["score"],
            "website": m["lender"].get("website", ""),
            "breakdown": m["breakdown"],
        }
        for m in matches
    ]

    return ChatResponse(
        reply=reply,
        profile_extracted=profile,
        matches_found=len(matches),
        matches=matches_out,
        ready=True,
    )
