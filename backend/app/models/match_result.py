from sqlalchemy import Column, Index, Integer, String, Float, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from backend.app.models.lender import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    # Borrower profile snapshot
    credit_score = Column(Integer)
    annual_income = Column(Float)
    employment_type = Column(String)
    years_at_current_work = Column(Float)
    loan_amount_needed = Column(Float)
    loan_purpose = Column(String)
    monthly_debt_payments = Column(Float)
    total_assets = Column(Float)
    income_stable = Column(Boolean)

    # Match outcome
    lenders_evaluated = Column(Integer)
    matches_found = Column(Integer)
    top_lender_name = Column(String)
    top_lender_score = Column(Float)
    advisor_fired = Column(Boolean, default=False)  # True when score < 60 or no matches

    # Analytics dimensions (added for BI pipeline)
    outcome = Column(String)       # approved / rejected / pending
    state = Column(String)         # US state (2-letter)
    funded_amount = Column(Float)  # 0 if rejected/pending, actual amount if approved

    # Full match details
    matches_json = Column(JSON)

    __table_args__ = (
        Index("ix_match_results_created_at", "created_at"),
        Index("ix_match_results_employment_type", "employment_type"),
    )
