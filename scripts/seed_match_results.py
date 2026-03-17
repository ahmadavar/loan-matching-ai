"""
Seed 500 synthetic borrower profiles + run them through the real matching engine.
Results are saved to match_results table for dbt analytics.
"""
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, SessionLocal
from backend.app.models.lender import Base
from backend.app.models.match_result import MatchResult
from backend.app.agents.matcher import find_matches
from backend.app.agents.advisor import should_advise
from backend.app.services.providers import get_lenders

random.seed(42)

# Realistic borrower personas with weights
EMPLOYMENT_TYPES = [
    ("salaried",     0.40),
    ("self_employed", 0.25),
    ("gig",          0.20),
    ("contractor",   0.15),
]

LOAN_PURPOSES = [
    ("personal",         0.25),
    ("debt_consolidation", 0.20),
    ("home_improvement", 0.15),
    ("auto",             0.15),
    ("business",         0.10),
    ("medical",          0.08),
    ("education",        0.05),
    ("home",             0.02),
]

def weighted_choice(options):
    choices, weights = zip(*options)
    return random.choices(choices, weights=weights, k=1)[0]

def generate_profile():
    emp = weighted_choice(EMPLOYMENT_TYPES)

    # Credit score distribution by employment type
    if emp == "salaried":
        credit = int(random.gauss(700, 70))
    elif emp == "self_employed":
        credit = int(random.gauss(670, 80))
    elif emp == "gig":
        credit = int(random.gauss(630, 90))
    else:  # contractor
        credit = int(random.gauss(680, 75))

    credit = max(450, min(850, credit))

    # Income by employment type
    if emp == "salaried":
        income = random.gauss(65000, 25000)
    elif emp == "self_employed":
        income = random.gauss(70000, 35000)
    elif emp == "gig":
        income = random.gauss(35000, 15000)
    else:
        income = random.gauss(80000, 30000)

    income = max(10000, round(income, -2))

    years = round(random.uniform(0.25, 12), 1)
    loan_amount = random.choice([5000, 8000, 10000, 15000, 20000, 25000, 30000, 40000, 50000])
    purpose = weighted_choice(LOAN_PURPOSES)
    monthly_debt = round(random.uniform(0, income / 12 * 0.6), -1)
    assets = round(random.uniform(0, income * 3), -2)
    income_stable = random.random() > 0.25

    return {
        "credit_score": credit,
        "annual_income": income,
        "employment_type": emp,
        "years_at_current_work": years,
        "loan_amount_needed": loan_amount,
        "loan_purpose": purpose,
        "monthly_debt_payments": monthly_debt,
        "total_assets": assets,
        "income_stable": income_stable,
    }

def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables ready.")

    db = SessionLocal()
    lenders = get_lenders(db)
    print(f"Loaded {len(lenders)} lenders.")

    # Clear existing synthetic data
    db.query(MatchResult).delete()
    db.commit()
    print("Cleared existing match results.")

    rows = []
    for i in range(500):
        profile = generate_profile()
        matches = find_matches(profile, lenders, top_k=5)

        # Spread created_at over past 90 days for realistic time series
        days_ago = random.randint(0, 90)
        hours_ago = random.randint(0, 23)
        created_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

        match_dicts = [
            {
                "lender_name": m["lender"]["name"],
                "score": m["score"],
                "breakdown": m["breakdown"],
            }
            for m in matches
        ]

        row = MatchResult(
            created_at=created_at,
            credit_score=profile["credit_score"],
            annual_income=profile["annual_income"],
            employment_type=profile["employment_type"],
            years_at_current_work=profile["years_at_current_work"],
            loan_amount_needed=profile["loan_amount_needed"],
            loan_purpose=profile["loan_purpose"],
            monthly_debt_payments=profile["monthly_debt_payments"],
            total_assets=profile["total_assets"],
            income_stable=profile["income_stable"],
            lenders_evaluated=len(lenders),
            matches_found=len(matches),
            top_lender_name=matches[0]["lender"]["name"] if matches else None,
            top_lender_score=matches[0]["score"] if matches else None,
            advisor_fired=should_advise(matches),
            matches_json=match_dicts,
        )
        rows.append(row)

        if (i + 1) % 50 == 0:
            print(f"  Generated {i + 1}/500...")

    db.bulk_save_objects(rows)
    db.commit()
    db.close()
    print("Done — 500 match results seeded.")

if __name__ == "__main__":
    seed()
