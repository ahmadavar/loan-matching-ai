from sqlalchemy import Column, Integer, String, Boolean, Float, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Lender(Base):
    __tablename__ = "lenders"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    website = Column(String)
    description = Column(String)

    credit_score_min = Column(Integer)
    credit_score_preferred = Column(Integer)
    min_annual_income = Column(Float)
    self_employed_friendly = Column(Boolean, default=False)

    loan_amount_min = Column(Float)
    loan_amount_max = Column(Float)
    loan_types = Column(JSON)
    specializations = Column(JSON)
    accepted_employment_types = Column(JSON)

    metadata_ = Column("metadata", JSON)
