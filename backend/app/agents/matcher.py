"""
Agent 3: Lender Matcher
6-dimension scoring engine. Returns ranked lender matches.
"""
from typing import List, Dict


def score_lender(lender: Dict, borrower: Dict) -> tuple[float, Dict]:
    breakdown = {}
    total = 0.0

    if borrower.get("employment_type") == "unemployed":
        breakdown["employment"] = {"points": 0, "note": "No active income — disqualified by all lenders"}
        return 0.0, breakdown

    purpose = borrower.get("loan_purpose", "personal")
    loan_types = lender.get("loan_types", [])
    if loan_types and purpose not in loan_types:
        breakdown["loan_purpose"] = {"points": 0, "note": f"Lender only offers {loan_types} — disqualified"}
        return 0.0, breakdown

    # 1. Credit Score (20 pts)
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
        return 0.0, breakdown

    # 2. Income + Stability (20 pts)
    income = borrower.get("annual_income", 0)
    min_income = lender.get("min_annual_income", 0)
    income_stable = borrower.get("income_stable", True)
    loan_amount = borrower.get("loan_amount_needed", 1)

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
        return 0.0, breakdown

    # 3. Assets (15 pts)
    assets = borrower.get("total_assets", 0)
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

    # 4. Employment Type + Experience (20 pts)
    emp_type = borrower.get("employment_type", "salaried")
    years_exp = borrower.get("years_at_current_work", 0)
    lender_friendly = lender.get("self_employed_friendly", False)
    accepted_types = lender.get("accepted_employment_types", ["salaried", "self_employed", "gig", "contractor"])

    if emp_type not in accepted_types:
        breakdown["employment"] = {"points": 0, "note": f"Lender does not accept {emp_type}"}
        return 0.0, breakdown

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

    # 5. DTI (15 pts)
    monthly_debt = borrower.get("monthly_debt_payments", 0)
    monthly_income = income / 12
    dti = (monthly_debt / monthly_income * 100) if monthly_income > 0 else 100

    if dti >= 100:
        breakdown["dti"] = {"points": 0, "note": f"DTI {dti:.0f}% — disqualified"}
        return 0.0, breakdown
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

    # 6. Loan Purpose (10 pts)
    breakdown["loan_purpose"] = {"points": 10, "note": "Loan purpose supported"}
    total += 10

    return round(total, 2), breakdown


def find_matches(borrower: Dict, lenders: List[Dict], top_k: int = 5) -> List[Dict]:
    results = []
    for lender in lenders:
        score, breakdown = score_lender(lender, borrower)
        if score > 0:
            results.append({"lender": lender, "score": score, "breakdown": breakdown})
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
