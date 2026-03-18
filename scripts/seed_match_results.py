"""
Seed 10,000 synthetic borrower profiles + run them through the real matching engine.
Results are saved to match_results table for dbt analytics.

New columns (v2): outcome, state, funded_amount
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

EMPLOYMENT_TYPES = [
    ("salaried",      0.40),
    ("self_employed", 0.25),
    ("gig",           0.20),
    ("contractor",    0.15),
]

LOAN_PURPOSES = [
    ("personal",           0.25),
    ("debt_consolidation", 0.20),
    ("home_improvement",   0.15),
    ("auto",               0.15),
    ("business",           0.10),
    ("medical",            0.08),
    ("education",          0.05),
    ("home",               0.02),
]

US_STATES = [
    "CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI",
    "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI",
    "CO", "MN", "SC", "AL", "LA", "KY", "OR", "OK", "CT", "UT",
    "IA", "NV", "AR", "MS", "KS", "NM", "NE", "WV", "ID", "HI",
    "NH", "ME", "MT", "RI", "DE", "SD", "ND", "AK", "VT", "WY",
]

# State weights — population-weighted so CA/TX/FL dominate realistically
STATE_WEIGHTS = [
    10, 9, 8, 8, 5, 5, 4, 4, 4, 4,
    4, 4, 4, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
]


def weighted_choice(options):
    choices, weights = zip(*options)
    return random.choices(choices, weights=weights, k=1)[0]


def generate_profile():
    emp = weighted_choice(EMPLOYMENT_TYPES)

    if emp == "salaried":
        credit = int(random.gauss(700, 70))
        income = random.gauss(65000, 25000)
    elif emp == "self_employed":
        credit = int(random.gauss(670, 80))
        income = random.gauss(70000, 35000)
    elif emp == "gig":
        credit = int(random.gauss(630, 90))
        income = random.gauss(35000, 15000)
    else:  # contractor
        credit = int(random.gauss(680, 75))
        income = random.gauss(80000, 30000)

    credit = max(450, min(850, credit))
    income = max(10000, round(income, -2))

    return {
        "credit_score": credit,
        "annual_income": income,
        "employment_type": emp,
        "years_at_current_work": round(random.uniform(0.25, 12), 1),
        "loan_amount_needed": random.choice([5000, 8000, 10000, 15000, 20000, 25000, 30000, 40000, 50000]),
        "loan_purpose": weighted_choice(LOAN_PURPOSES),
        "monthly_debt_payments": round(random.uniform(0, income / 12 * 0.6), -1),
        "total_assets": round(random.uniform(0, income * 3), -2),
        "income_stable": random.random() > 0.25,
    }


def derive_outcome(top_score, matches_found):
    """
    Outcome is derived from the real match score so it's consistent with the data.
    Score >= 75 → mostly approved
    Score 55-74 → mix of approved/pending
    Score < 55 or no matches → mostly rejected
    """
    if matches_found == 0:
        return "rejected"

    if top_score >= 75:
        outcome = random.choices(["approved", "pending", "rejected"], weights=[0.70, 0.20, 0.10])[0]
    elif top_score >= 55:
        outcome = random.choices(["approved", "pending", "rejected"], weights=[0.40, 0.35, 0.25])[0]
    else:
        outcome = random.choices(["approved", "pending", "rejected"], weights=[0.15, 0.25, 0.60])[0]

    return outcome


def seed():
    Base.metadata.create_all(bind=engine)
    print("Tables ready.")

    db = SessionLocal()
    lenders = get_lenders(db)
    print(f"Loaded {len(lenders)} lenders.")

    db.query(MatchResult).delete()
    db.commit()
    print("Cleared existing match results.")

    total = 10000
    rows = []

    for i in range(total):
        profile = generate_profile()
        matches = find_matches(profile, lenders, top_k=5)

        # Spread over past 365 days for richer time series
        days_ago = random.randint(0, 365)
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

        top_score = matches[0]["score"] if matches else 0
        outcome = derive_outcome(top_score, len(matches))

        if outcome == "approved":
            funded_amount = round(profile["loan_amount_needed"] * random.uniform(0.80, 1.0), -2)
        else:
            funded_amount = 0.0

        state = random.choices(US_STATES, weights=STATE_WEIGHTS, k=1)[0]

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
            top_lender_score=top_score,
            advisor_fired=should_advise(matches),
            outcome=outcome,
            state=state,
            funded_amount=funded_amount,
            matches_json=match_dicts,
        )
        rows.append(row)

        if (i + 1) % 500 == 0:
            db.bulk_save_objects(rows)
            db.commit()
            rows = []
            print(f"  Saved {i + 1}/{total}...")

    if rows:
        db.bulk_save_objects(rows)
        db.commit()

    db.close()
    print(f"Done — {total} match results seeded.")


if __name__ == "__main__":
    seed()
