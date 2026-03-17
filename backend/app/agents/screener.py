"""
Agent 2: Eligibility Screener
Hard disqualifications before scoring runs.
Returns (passed: bool, reason: str | None)
"""


def screen_borrower(profile: dict) -> tuple[bool, str | None]:
    """
    Run hard disqualification checks.
    Returns (True, None) if borrower passes, (False, reason) if disqualified.
    """
    employment = profile.get("employment_type")
    income = profile.get("annual_income", 0)
    monthly_debt = profile.get("monthly_debt_payments", 0)
    monthly_income = income / 12 if income else 0
    dti = (monthly_debt / monthly_income * 100) if monthly_income > 0 else 100

    if employment == "unemployed" or income == 0:
        return False, (
            "Thanks for sharing all that. Unfortunately, lenders require an active income source to approve a loan. "
            "Without verifiable income, none of the lenders in our network can match you right now.\n\n"
            "**A few options worth knowing about:**\n"
            "- Come back once you have employment or a documented income source\n"
            "- Check out **Kiva** — they offer 0% interest microloans and weigh character over income\n"
            "- Look into government assistance programs for your situation"
        )

    if dti >= 100:
        return False, (
            f"Your monthly debt payments (${monthly_debt:,.0f}) exceed your monthly income (${monthly_income:,.0f}). "
            "No lender will approve a loan when debt-to-income ratio is over 100%. "
            "Focus on paying down existing debt first — even getting DTI below 50% opens up options."
        )

    return True, None
