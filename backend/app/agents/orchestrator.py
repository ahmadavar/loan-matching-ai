"""
Multi-Agent Orchestrator
Runs all 5 agents in sequence for a single chat turn.

Flow:
  1. ProfileExtractor   — parse user message into structured fields
  2. (collect fields until complete)
  3. EligibilityScreener — hard disqualify before scoring
  4. LenderMatcher       — 6-dimension scoring
  5. ExplanationWriter   — plain-English verdict
  6. ImprovementAdvisor  — fires if best score < 60 or no matches
"""
from backend.app.agents.extractor import extract_borrower_profile, fill_defaults
from backend.app.agents.screener import screen_borrower
from backend.app.agents.matcher import find_matches
from backend.app.agents.explainer import explain_matches
from backend.app.agents.advisor import should_advise, get_improvement_advice

REQUIRED_FIELDS = [
    "loan_amount_needed",
    "loan_purpose",
    "credit_score",
    "employment_type",
    "annual_income",
    "monthly_debt_payments",
    "years_at_current_work",
    "total_assets",
]

FOLLOW_UPS = {
    "loan_amount_needed": "Hey, happy to help you find the right lender. How much are you looking to borrow?",
    "loan_purpose": (
        "What's the loan for?\n\n"
        "*(medical, car, home project, debt payoff, business, education, or something else?)*"
    ),
    "credit_score": (
        "Roughly what's your credit score? No judgment here — it just helps me find lenders who are actually a good fit.\n\n"
        "- **Excellent** — 750+\n"
        "- **Good** — 700–749\n"
        "- **Fair** — 650–699\n"
        "- **Needs work** — below 650"
    ),
    "employment_type": (
        "What kind of work do you do?\n\n"
        "- Regular **salaried** job\n"
        "- **Self-employed** or freelancer\n"
        "- **Gig work** (Uber, DoorDash, Fiverr, etc.)\n"
        "- **Contractor** / 1099"
    ),
    "annual_income": "Roughly what's your annual income? A ballpark is totally fine — no tax returns needed.",
    "monthly_debt_payments": (
        "Do you have any existing monthly debt payments? Think credit cards, car loan, student loans. "
        "Just say $0 if none."
    ),
    "years_at_current_work": (
        "How long have you been in your current job or line of work? "
        "*(e.g. 6 months, 2 years, 5+ years)*"
    ),
    "total_assets": (
        "Last one — do you have any savings, investments, or property? "
        "A rough total works, or just say $0 if not applicable."
    ),
}

ACKNOWLEDGEMENTS = {
    "loan_purpose": ["Got it.", "Makes sense.", "Good to know."],
    "credit_score": ["Got it.", "Thanks.", "Noted."],
    "employment_type": ["Got it.", "Makes sense.", "Good to know."],
    "annual_income": ["Got it.", "Thanks.", "Noted."],
    "monthly_debt_payments": ["Got it.", "Noted.", "Thanks."],
}


def get_ack(field: str, index: int = 0) -> str:
    options = ACKNOWLEDGEMENTS.get(field, ["Got it!"])
    return options[index % len(options)]


def run(message: str, gathered_profile: dict, pending_field: str | None, lenders: list) -> dict:
    """
    Run one turn of the multi-agent pipeline.
    Returns a dict with: reply, profile_extracted, matches, ready, pending_field
    """

    # Handle restart flow
    restart_phrases = ["yes", "yeah", "sure", "adjust", "try again", "restart", "reset", "start over", "yep", "ok", "okay"]
    if pending_field == "restart" and any(p in message.lower() for p in restart_phrases):
        return {
            "reply": "No problem! Let's try again. How much are you looking to borrow?",
            "profile_extracted": {},
            "matches": [],
            "ready": False,
            "pending_field": "loan_amount_needed",
        }

    # --- Agent 1: Profile Extractor ---
    new_fields = extract_borrower_profile(message, pending_field=pending_field)

    merged = dict(gathered_profile)
    last_filled = None
    if new_fields:
        for k, v in new_fields.items():
            if v is not None and merged.get(k) is None:
                merged[k] = v
                last_filled = k

    # Check missing fields
    missing = [f for f in REQUIRED_FIELDS if merged.get(f) is None]

    if missing:
        next_field = missing[0]
        follow_up = FOLLOW_UPS[next_field]
        if last_filled and last_filled != next_field:
            reply = f"{get_ack(last_filled)} {follow_up}"
        else:
            reply = follow_up
        return {
            "reply": reply,
            "profile_extracted": merged,
            "matches": [],
            "ready": False,
            "pending_field": next_field,
        }

    # All fields collected — fill defaults and run matching pipeline
    profile = fill_defaults(merged)

    # --- Agent 2: Eligibility Screener ---
    passed, disqualify_reason = screen_borrower(profile)
    if not passed:
        return {
            "reply": disqualify_reason,
            "profile_extracted": profile,
            "matches": [],
            "ready": True,
            "pending_field": None,
        }

    # --- Agent 3: Lender Matcher ---
    matches = find_matches(profile, lenders, top_k=5)

    if not matches:
        # No matches — go straight to advisor
        advice = get_improvement_advice(profile, [], lenders)
        reply = (
            f"I ran your profile against all {len(lenders)} lenders and couldn't find a strong fit right now.\n\n"
            f"**Here's exactly what to change to get approved:**\n\n{advice}"
        )
        return {
            "reply": reply,
            "profile_extracted": profile,
            "matches": [],
            "ready": True,
            "pending_field": None,
        }

    # --- Agent 4: Explanation Writer ---
    explanation = explain_matches(profile, matches)

    top_lenders = ", ".join([m["lender"]["name"] for m in matches[:3]])
    reply = (
        f"Matched you against **{len(lenders)} lenders**. Here are your top results.\n\n"
        f"Best fits: **{top_lenders}**.\n\n"
        f"{explanation}"
    )

    # --- Agent 5: Improvement Advisor ---
    if should_advise(matches):
        advice = get_improvement_advice(profile, matches, lenders)
        reply += f"\n\n---\n**Want better matches? Here's what to work on:**\n\n{advice}"

    matches_out = [
        {
            "lender_name": m["lender"]["name"],
            "score": m["score"],
            "website": m["lender"].get("website", ""),
            "breakdown": m["breakdown"],
        }
        for m in matches
    ]

    return {
        "reply": reply,
        "profile_extracted": profile,
        "matches": matches_out,
        "ready": True,
        "pending_field": None,
    }
