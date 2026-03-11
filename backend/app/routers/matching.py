from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from typing import Optional
from backend.app.services.matching import find_matches, explain_matches

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class BorrowerRequest(BaseModel):
    credit_score: int
    annual_income: float
    employment_type: str                    # "salaried", "self_employed", "gig", "contractor"
    years_at_current_work: float
    loan_amount_needed: float
    loan_purpose: str                       # "personal", "business", "home"
    total_assets: Optional[float] = 0
    monthly_debt_payments: Optional[float] = 0
    income_stable: Optional[bool] = True


class MatchResponse(BaseModel):
    lender_name: str
    score: float
    breakdown: dict
    explanation: str


@router.post("/match", response_model=list[MatchResponse])
@limiter.limit("10/day")
async def match_borrower(request: Request, borrower: BorrowerRequest):
    """
    Match a borrower against all lenders.
    Rate limited to 10 requests per day per IP.
    """
    # Hardcoded lenders for now — will load from DB later
    from backend.app.data.lenders import LENDERS

    borrower_dict = borrower.model_dump()

    matches = find_matches(borrower_dict, LENDERS, top_k=5)

    if not matches:
        raise HTTPException(status_code=404, detail="No matching lenders found for your profile")

    explanation = explain_matches(borrower_dict, matches)

    return [
        MatchResponse(
            lender_name=m["lender"]["name"],
            score=m["score"],
            breakdown=m["breakdown"],
            explanation=explanation
        )
        for m in matches
    ]
