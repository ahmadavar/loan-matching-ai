from fastapi import APIRouter, Request, HTTPException, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.services.matching import find_matches, explain_matches
from backend.app.services.providers import get_lenders
from backend.app.database import get_db
from backend.app.models.match_result import MatchResult

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class BorrowerRequest(BaseModel):
    credit_score: int
    annual_income: float
    employment_type: str
    years_at_current_work: float
    loan_amount_needed: float
    loan_purpose: str
    total_assets: Optional[float] = 0
    monthly_debt_payments: Optional[float] = 0
    income_stable: Optional[bool] = True


class MatchResponse(BaseModel):
    lender_name: str
    score: float
    breakdown: dict
    explanation: str


@router.post("/match", response_model=list[MatchResponse])
@limiter.limit("50/day")
async def match_borrower(request: Request, borrower: BorrowerRequest, db: Session = Depends(get_db)):
    lenders_data = get_lenders(db)

    if not lenders_data:
        raise HTTPException(status_code=503, detail="Lender database is empty.")

    borrower_dict = borrower.model_dump()
    matches = find_matches(borrower_dict, lenders_data, top_k=5)

    if not matches:
        raise HTTPException(status_code=404, detail="No matching lenders found for your profile.")

    explanation = explain_matches(borrower_dict, matches)

    try:
        row = MatchResult(
            credit_score=borrower.credit_score,
            annual_income=borrower.annual_income,
            employment_type=borrower.employment_type,
            years_at_current_work=borrower.years_at_current_work,
            loan_amount_needed=borrower.loan_amount_needed,
            loan_purpose=borrower.loan_purpose,
            monthly_debt_payments=borrower.monthly_debt_payments,
            total_assets=borrower.total_assets,
            income_stable=borrower.income_stable,
            lenders_evaluated=len(lenders_data),
            matches_found=len(matches),
            top_lender_name=matches[0]["lender"]["name"] if matches else None,
            top_lender_score=matches[0]["score"] if matches else None,
            matches_json=[
                {"lender_name": m["lender"]["name"], "score": m["score"], "breakdown": m["breakdown"]}
                for m in matches
            ],
        )
        db.add(row)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[match] MatchResult DB write failed: {e}")

    return [
        MatchResponse(
            lender_name=m["lender"]["name"],
            score=m["score"],
            breakdown=m["breakdown"],
            explanation=explanation
        )
        for m in matches
    ]
