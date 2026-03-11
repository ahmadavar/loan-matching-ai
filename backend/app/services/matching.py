from typing import List, Dict
import anthropic
import os


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

    if min_income == 0 or income >= min_income:
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

    if dti < 20:
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
    purpose = borrower.get("loan_purpose", "personal")
    loan_types = lender.get("loan_types", [])

    if purpose in loan_types or not loan_types:
        breakdown["loan_purpose"] = {"points": 10, "note": "Loan purpose supported"}
        total += 10
    else:
        breakdown["loan_purpose"] = {"points": 0, "note": "Lender doesn't offer this loan type"}

    return round(total, 2), breakdown


def find_matches(borrower: Dict, lenders: List[Dict], top_k: int = 5) -> List[Dict]:
    """
    Match borrower against all lenders. Returns top_k sorted by score.
    """
    results = []

    for lender in lenders:
        score, breakdown = score_lender(lender, borrower)
        if score > 0:
            results.append({
                "lender": lender,
                "score": score,
                "breakdown": breakdown
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
