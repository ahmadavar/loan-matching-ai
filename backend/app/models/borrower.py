from sqlalchemy import Column, Integer, String, Boolean, Float, JSON, DateTime
from sqlalchemy.sql import func
from backend.app.models.lender import Base


class BorrowerProfile(Base):
    __tablename__ = "borrower_profiles"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    # Profile
    credit_score = Column(Integer)
    annual_income = Column(Float)
    employment_type = Column(String)        # "self_employed", "salaried", "contractor"
    is_self_employed = Column(Boolean, default=False)

    # Loan request
    loan_amount_needed = Column(Float)
    loan_purpose = Column(String)           # "home", "business", "personal"

    # Flexible extra data
    profile_data = Column(JSON)
