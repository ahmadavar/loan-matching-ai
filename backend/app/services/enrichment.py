def enrich_bonus_dimensions(profile: dict) -> dict:
    """
    Infer bonus dimensions D7-D9 from existing profile fields.
    These approximate what Plaid bank data would provide.
    Applied before scoring so gig/self-employed borrowers get fair treatment.
    """
    emp = profile.get("employment_type", "")
    years = profile.get("years_at_current_work", 0) or 0
    income_stable = profile.get("income_stable", True)
    monthly_debt = profile.get("monthly_debt_payments", 0) or 0
    annual_income = profile.get("annual_income", 1) or 1
    dti = (monthly_debt * 12 / annual_income * 100) if annual_income > 0 else 100

    # D7: income_continuity_months — derive from years at work
    if emp in ("self_employed", "gig", "freelance"):
        profile["income_continuity_months"] = int(years * 12)
    else:
        profile["income_continuity_months"] = 0

    # D8: payment_behavior_score — proxy from income stability + DTI
    if income_stable and dti < 20:
        profile["payment_behavior_score"] = 90.0
    elif income_stable and dti < 36:
        profile["payment_behavior_score"] = 75.0
    elif income_stable:
        profile["payment_behavior_score"] = 60.0
    else:
        profile["payment_behavior_score"] = 45.0

    # D9: income_source_count — proxy from employment type
    if emp == "gig":
        profile["income_source_count"] = 3
    elif emp in ("self_employed", "freelance"):
        profile["income_source_count"] = 2
    else:
        profile["income_source_count"] = 1

    return profile
