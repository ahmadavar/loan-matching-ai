"""
Agent 5: Improvement Advisor (NEW)
Fires when best score < 60 or no matches found.
Gives specific, actionable advice on what to change to get approved.
"""
import anthropic
import os
from typing import List, Dict


def should_advise(matches: List[Dict]) -> bool:
    """Fire advisor if no matches or best score is below 60."""
    if not matches:
        return True
    return matches[0]["score"] < 60


def get_improvement_advice(borrower: Dict, matches: List[Dict], all_lenders: List[Dict]) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    income = borrower.get("annual_income", 0)
    monthly_income = income / 12 if income else 0
    monthly_debt = borrower.get("monthly_debt_payments", 0)
    dti = (monthly_debt / monthly_income * 100) if monthly_income > 0 else 0
    credit = borrower.get("credit_score", 0)
    years_exp = borrower.get("years_at_current_work", 0)
    loan_amount = borrower.get("loan_amount_needed", 0)
    emp_type = borrower.get("employment_type", "salaried")

    # Find the closest lenders the borrower almost qualified for
    near_misses = []
    for lender in all_lenders:
        min_credit = lender.get("credit_score_min", 0)
        min_income = lender.get("min_annual_income", 0)
        accepted_types = lender.get("accepted_employment_types", [])
        purpose = borrower.get("loan_purpose", "personal")
        loan_types = lender.get("loan_types", [])

        if purpose not in loan_types:
            continue
        if emp_type not in accepted_types:
            continue

        credit_gap = max(0, min_credit - credit)
        income_gap = max(0, min_income - income)

        # Near miss: within 50 credit points and within 20% income gap
        if credit_gap <= 50 and income_gap <= income * 0.2:
            near_misses.append({
                "name": lender["name"],
                "credit_gap": credit_gap,
                "income_gap": income_gap,
                "min_credit": min_credit,
                "min_income": min_income,
            })

    near_misses.sort(key=lambda x: x["credit_gap"] + (x["income_gap"] / 1000))
    near_miss_text = ""
    for nm in near_misses[:3]:
        parts = []
        if nm["credit_gap"] > 0:
            parts.append(f"+{nm['credit_gap']} credit points (need {nm['min_credit']})")
        if nm["income_gap"] > 0:
            parts.append(f"+${nm['income_gap']:,.0f}/yr income (need ${nm['min_income']:,.0f})")
        if parts:
            near_miss_text += f"- {nm['name']}: {', '.join(parts)}\n"

    top_score = matches[0]["score"] if matches else 0
    top_name = matches[0]["lender"]["name"] if matches else "none"

    prompt = f"""You are a direct, practical loan advisor. A borrower got weak matches (best score: {top_score}/100, top lender: {top_name}).

Borrower profile:
- Credit score: {credit}
- Annual income: ${income:,}
- Employment: {emp_type}, {years_exp} years
- Loan needed: ${loan_amount:,} for {borrower.get('loan_purpose')}
- Monthly debt payments: ${monthly_debt:,} (DTI: {dti:.0f}%)
- Assets: ${borrower.get('total_assets', 0):,}

Near-miss lenders (close but not quite):
{near_miss_text if near_miss_text else "None found for this loan type/employment combo"}

Write 3-4 specific, numbered action items the borrower can take to get approved.
Be concrete with numbers — e.g. "Pay down $X/month to drop DTI from Y% to 36%" not "improve your DTI".
Mention specific lenders they'd unlock if possible.
Keep it under 150 words. No fluff, no preamble."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text
