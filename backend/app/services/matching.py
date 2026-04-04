from typing import List, Dict
import anthropic
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../../.env"))


def score_lender(lender: Dict, borrower: Dict) -> tuple[float, Dict]:
    """
    Score a lender against a borrower profile across 6 dimensions.
    Returns (total_score, breakdown) where breakdown explains each dimension.
    """
    breakdown = {}
    total = 0.0

    # 0. Hard disqualify unemployed borrowers immediately
    if borrower.get("employment_type") == "unemployed":
        breakdown["employment"] = {"points": 0, "note": "No active income — disqualified by all lenders"}
        return 0.0, breakdown

    # 0b. Hard disqualify on loan purpose mismatch
    purpose = borrower.get("loan_purpose", "personal")
    loan_types = lender.get("loan_types", [])
    if loan_types and purpose not in loan_types:
        breakdown["loan_purpose"] = {"points": 0, "note": f"Lender only offers {loan_types} — disqualified"}
        return 0.0, breakdown

    # 1. Credit Score (20 points)
    credit = borrower.get("credit_score", 0)
    min_credit = lender.get("credit_score_min", 0)
    preferred_credit = lender.get("credit_score_preferred", min_credit)

    if credit >= preferred_credit:
        breakdown["credit_score"] = {"points": 20, "note": "Exceeds preferred credit score"}
        total += 20
    elif credit >= min_credit:
        ratio = (credit - min_credit) / max(preferred_credit - min_credit, 1)
        pts = round(20 * ratio, 1)
        breakdown["credit_score"] = {"points": pts, "note": "Meets minimum but below preferred"}
        total += pts
    else:
        breakdown["credit_score"] = {"points": 0, "note": "Below minimum — disqualified"}
        return 0.0, breakdown  # Hard disqualification

    # 2. Income + Stability (20 points)
    income = borrower.get("annual_income", 0)
    min_income = lender.get("min_annual_income", 0)
    income_stable = borrower.get("income_stable", True)  # 2+ years consistent
    loan_amount = borrower.get("loan_amount_needed", 1)

    # Hard floor: income must be at least 20% of loan amount annually
    if income > 0 and income < loan_amount * 0.2:
        breakdown["income"] = {"points": 0, "note": f"Income (${income:,.0f}/yr) too low to service ${loan_amount:,.0f} loan — disqualified"}
        return 0.0, breakdown

    if min_income == 0 or income >= min_income:
        if income < 15000:
            pts = 10 if income_stable else 6
            note = f"Very low income (${income:,.0f}/yr) — limited repayment capacity"
        else:
            pts = 20 if income_stable else 14
            note = "Income meets requirement" + ("" if income_stable else " but stability unclear")
        breakdown["income"] = {"points": pts, "note": note}
        total += pts
    elif income >= min_income * 0.8:
        pts = 10 if income_stable else 6
        breakdown["income"] = {"points": pts, "note": "Slightly below minimum income"}
        total += pts
    else:
        breakdown["income"] = {"points": 0, "note": "Income too low — disqualified"}
        return 0.0, breakdown  # Hard disqualification

    # 3. Assets / Net Worth (15 points)
    assets = borrower.get("total_assets", 0)
    loan_amount = borrower.get("loan_amount_needed", 1)
    asset_ratio = assets / max(loan_amount, 1)

    if asset_ratio >= 3:
        breakdown["assets"] = {"points": 15, "note": "Strong asset backing"}
        total += 15
    elif asset_ratio >= 1:
        breakdown["assets"] = {"points": 10, "note": "Moderate asset backing"}
        total += 10
    elif asset_ratio >= 0.5:
        breakdown["assets"] = {"points": 5, "note": "Limited asset backing"}
        total += 5
    else:
        breakdown["assets"] = {"points": 0, "note": "No significant assets"}

    # 4. Employment Type + Experience (20 points)
    emp_type = borrower.get("employment_type", "salaried")
    years_exp = borrower.get("years_at_current_work", 0)
    lender_friendly = lender.get("self_employed_friendly", False)
    accepted_types = lender.get("accepted_employment_types", ["salaried", "self_employed", "gig", "contractor"])

    if emp_type not in accepted_types:
        breakdown["employment"] = {"points": 0, "note": f"Lender does not accept {emp_type}"}
        return 0.0, breakdown  # Hard disqualification

    if emp_type in ["self_employed", "gig", "contractor"]:
        if lender_friendly and years_exp >= 2:
            breakdown["employment"] = {"points": 20, "note": "Lender specializes in this profile + strong experience"}
            total += 20
        elif lender_friendly:
            breakdown["employment"] = {"points": 12, "note": "Lender accepts this type but limited experience"}
            total += 12
        else:
            breakdown["employment"] = {"points": 5, "note": "Lender accepts but not specialized"}
            total += 5
    else:
        pts = 20 if years_exp >= 2 else 14
        breakdown["employment"] = {"points": pts, "note": "Salaried employment accepted"}
        total += pts

    # 5. Debt-to-Income Ratio (15 points)
    monthly_debt = borrower.get("monthly_debt_payments", 0)
    monthly_income = income / 12
    dti = (monthly_debt / monthly_income * 100) if monthly_income > 0 else 100

    if dti >= 100:
        breakdown["dti"] = {"points": 0, "note": f"DTI {dti:.0f}% — debt exceeds income, no lender will approve"}
        return 0.0, breakdown  # Hard disqualification
    elif dti < 20:
        breakdown["dti"] = {"points": 15, "note": f"Excellent DTI: {dti:.0f}%"}
        total += 15
    elif dti < 36:
        breakdown["dti"] = {"points": 10, "note": f"Good DTI: {dti:.0f}%"}
        total += 10
    elif dti < 50:
        breakdown["dti"] = {"points": 5, "note": f"High DTI: {dti:.0f}%"}
        total += 5
    else:
        breakdown["dti"] = {"points": 0, "note": f"DTI too high: {dti:.0f}%"}

    # 6. Loan Purpose Match (10 points)
    # Already hard-disqualified at top if purpose doesn't match.
    # Reaching here means purpose is supported.
    breakdown["loan_purpose"] = {"points": 10, "note": "Loan purpose supported"}
    total += 10

    # --- BONUS DIMENSIONS (up to +30 points) ---
    # These represent verifiable alternative data that reduces lender uncertainty
    # for gig workers and self-employed borrowers. Regulatory basis:
    #   D7: Fannie Mae 2-year self-employment guideline
    #   D8: Experian Boost precedent + CFPB alternative data guidance
    #   D9: Business underwriting concentration risk — applied to individuals

    # 7. Income Continuity — consistent self-employment over time (+10 points)
    # Measures: how many consecutive months of documented 1099/gig income
    income_months = borrower.get("income_continuity_months", 0)
    if emp_type in ["self_employed", "gig", "contractor"]:
        if income_months >= 24:
            breakdown["income_continuity"] = {"points": 10, "note": f"{income_months} months continuous gig income — meets 2-year standard"}
            total += 10
        elif income_months >= 12:
            pts = 6
            breakdown["income_continuity"] = {"points": pts, "note": f"{income_months} months continuous income — approaching 2-year standard"}
            total += pts
        elif income_months >= 6:
            pts = 3
            breakdown["income_continuity"] = {"points": pts, "note": f"{income_months} months income history — limited continuity"}
            total += pts
        else:
            breakdown["income_continuity"] = {"points": 0, "note": "Less than 6 months income history — high uncertainty"}
    else:
        # Salaried borrowers get full credit — employer verifies continuity
        breakdown["income_continuity"] = {"points": 10, "note": "Salaried — employer verifies income continuity"}
        total += 10

    # 8. Payment Behavior Outside Credit Bureau (+10 points)
    # Measures: on-time payment score for utilities, rent, subscriptions (0–100)
    # Captures creditworthy behavior invisible to traditional bureaus
    payment_score = borrower.get("payment_behavior_score", None)
    if payment_score is not None:
        if payment_score >= 90:
            breakdown["payment_behavior"] = {"points": 10, "note": f"Excellent off-bureau payment history ({payment_score}/100)"}
            total += 10
        elif payment_score >= 75:
            pts = 7
            breakdown["payment_behavior"] = {"points": pts, "note": f"Good off-bureau payment history ({payment_score}/100)"}
            total += pts
        elif payment_score >= 60:
            pts = 4
            breakdown["payment_behavior"] = {"points": pts, "note": f"Mixed off-bureau payment history ({payment_score}/100)"}
            total += pts
        else:
            breakdown["payment_behavior"] = {"points": 0, "note": f"Poor off-bureau payment history ({payment_score}/100)"}
    else:
        breakdown["payment_behavior"] = {"points": 0, "note": "No payment behavior data provided — submit utility/rent history to improve score"}

    # 9. Income Diversity — number of distinct income sources (+10 points)
    # Measures: how many separate clients/platforms generate income
    # More sources = less concentration risk = more resilient income
    income_sources = borrower.get("income_source_count", 1)
    if emp_type in ["self_employed", "gig", "contractor"]:
        if income_sources >= 5:
            breakdown["income_diversity"] = {"points": 10, "note": f"{income_sources} income sources — highly diversified, low concentration risk"}
            total += 10
        elif income_sources >= 3:
            pts = 7
            breakdown["income_diversity"] = {"points": pts, "note": f"{income_sources} income sources — diversified"}
            total += pts
        elif income_sources == 2:
            pts = 4
            breakdown["income_diversity"] = {"points": pts, "note": "2 income sources — some diversification"}
            total += pts
        else:
            breakdown["income_diversity"] = {"points": 0, "note": "Single income source — concentration risk"}
    else:
        # Salaried: single employer is normal, not a risk flag
        breakdown["income_diversity"] = {"points": 7, "note": "Salaried — single employer income is standard"}
        total += 7

    return round(min(total, 100.0), 2), breakdown


def estimate_apr(score: float, apr_min: float, apr_max: float, max_score: float = 100.0) -> float:
    """
    Estimate a borrower's APR within a lender's real rate range based on their score.
    Higher score = closer to apr_min. Lower score = closer to apr_max.
    """
    if apr_min is None or apr_max is None:
        return None
    ratio = 1.0 - (min(score, max_score) / max_score)
    return round(apr_min + ratio * (apr_max - apr_min), 2)


def find_matches(borrower: Dict, lenders: List[Dict], top_k: int = 5) -> List[Dict]:
    """
    Match borrower against all lenders using rule-based scoring.
    """
    results = []

    for lender in lenders:
        score, breakdown = score_lender(lender, borrower)
        if score > 0:
            results.append({
                "lender": lender,
                "score": score,
                "breakdown": breakdown,
                "estimated_apr": estimate_apr(score, lender.get("apr_min"), lender.get("apr_max")),
                "apr_min": lender.get("apr_min"),
                "apr_max": lender.get("apr_max"),
                "apr_source": lender.get("apr_source", "synthetic"),
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


def explain_matches(borrower: Dict, matches: List[Dict]) -> str:
    """
    Use Claude to generate a plain-English explanation of the top matches.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Build a summary for Claude to work with
    borrower_summary = f"""
Borrower Profile:
- Credit score: {borrower.get('credit_score')}
- Annual income: ${borrower.get('annual_income'):,}
- Employment: {borrower.get('employment_type')} ({borrower.get('years_at_current_work', 0)} years)
- Loan needed: ${borrower.get('loan_amount_needed'):,} for {borrower.get('loan_purpose')}
- Total assets: ${borrower.get('total_assets', 0):,}
- Monthly debt payments: ${borrower.get('monthly_debt_payments', 0):,}
- Income stable: {borrower.get('income_stable', True)}
"""

    matches_summary = ""
    for i, m in enumerate(matches, 1):
        lender = m["lender"]
        matches_summary += f"\n{i}. {lender['name']} — Score: {m['score']}/100\n"
        for dimension, detail in m["breakdown"].items():
            matches_summary += f"   - {dimension}: {detail['note']} ({detail['points']} pts)\n"

    prompt = f"""You are a helpful loan advisor. Based on this borrower profile and their top lender matches,
write a friendly, clear explanation of why each lender was matched and what the borrower should know.
Be specific, honest about weaknesses, and highlight what makes each lender a good or partial fit.
Keep it under 200 words total.

{borrower_summary}

Top Matches:
{matches_summary}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",  # Cheapest model for explanations
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text
