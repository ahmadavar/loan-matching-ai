from sqlalchemy import Column, Integer, String, Boolean, Float, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Lender(Base):
    __tablename__ = "lenders"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    website = Column(String)
    description = Column(String)

    # Eligibility criteria
    credit_score_min = Column(Integer)          # e.g. 620
    credit_score_preferred = Column(Integer)    # e.g. 700
    min_annual_income = Column(Float)           # e.g. 30000.0
    self_employed_friendly = Column(Boolean, default=False)

    # Loan details
    loan_amount_min = Column(Float)
    loan_amount_max = Column(Float)
    loan_types = Column(JSON)           # ["personal", "business", "mortgage"]
    specializations = Column(JSON)      # ["self-employed", "gig workers"]

    # Extra flexible data
    metadata_ = Column("metadata", JSON)
