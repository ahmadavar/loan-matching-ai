from fastapi import APIRouter, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.agents import orchestrator
from backend.app.agents.advisor import should_advise
from backend.app.services.providers import get_lenders
from backend.app.database import get_db
from backend.app.models.match_result import MatchResult

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

    # Log completed matches to database
    if result["ready"] and result["profile_extracted"]:
        profile = result["profile_extracted"]
        matches = result["matches"]
        try:
            row = MatchResult(
                credit_score=profile.get("credit_score"),
                annual_income=profile.get("annual_income"),
                employment_type=profile.get("employment_type"),
                years_at_current_work=profile.get("years_at_current_work"),
                loan_amount_needed=profile.get("loan_amount_needed"),
                loan_purpose=profile.get("loan_purpose"),
                monthly_debt_payments=profile.get("monthly_debt_payments"),
                total_assets=profile.get("total_assets"),
                income_stable=profile.get("income_stable"),
                lenders_evaluated=len(lenders),
                matches_found=len(matches),
                top_lender_name=matches[0]["lender_name"] if matches else None,
                top_lender_score=matches[0]["score"] if matches else None,
                advisor_fired=should_advise([{"score": matches[0]["score"]} for m in matches[:1]] if matches else []),
                matches_json=matches,
            )
            db.add(row)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[chat] MatchResult DB write failed: {e}")

    return ChatResponse(
        reply=result["reply"],
        profile_extracted=result["profile_extracted"],
        matches_found=len(result["matches"]),
        matches=result["matches"],
        ready=result["ready"],
        pending_field=result["pending_field"],
    )
