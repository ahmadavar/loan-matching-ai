import anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()


def extract_borrower_profile(user_message: str) -> dict | None:
    """
    Use Claude to extract a structured borrower profile from natural language.
    Returns a dict matching BorrowerRequest schema, or None if extraction fails.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""Extract borrower financial information from this message and return ONLY a valid JSON object.

Message: "{user_message}"

Return this exact JSON structure with your best estimates from the message.
Use null for any field not mentioned:

{{
  "credit_score": <integer 300-850 or null>,
  "annual_income": <float or null>,
  "employment_type": <"salaried" | "self_employed" | "gig" | "contractor" or null>,
  "years_at_current_work": <float or null>,
  "loan_amount_needed": <float or null>,
  "loan_purpose": <"personal" | "business" | "home" | "debt_consolidation" | "auto" | "rv" | "vacation" | "medical" | "education" | "home_improvement" or null>,
  "total_assets": <float or null>,
  "monthly_debt_payments": <float or null>,
  "income_stable": <true | false>
}}

Rules:
- "freelance", "freelancer", "self-employed", "consultant" → "self_employed"
- "gig", "uber", "lyft", "doordash", "delivery", "rideshare" → "gig"
- "contractor", "1099" → "contractor"
- "unemployed", "no job", "no income", "no work", "between jobs", "laid off", "out of work" → employment_type: "unemployed", annual_income: 0
- If income is mentioned as monthly, multiply by 12
- If credit is described as "good" use 700, "excellent" use 760, "fair" use 640, "bad" use 580
- income_stable is false if unemployed or income is irregular or inconsistent
- Return ONLY the JSON, no explanation"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    try:
        raw = response.content[0].text.strip()
        # Strip markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception:
        return None


def fill_defaults(profile: dict) -> dict:
    """Fill null values with sensible defaults so matching can proceed."""
    # Don't override explicitly extracted values like unemployment
    is_unemployed = profile.get("employment_type") == "unemployed"

    defaults = {
        "credit_score": 650,
        "annual_income": 0 if is_unemployed else 40000,
        "employment_type": "salaried",
        "years_at_current_work": 0.0 if is_unemployed else 1.0,
        "loan_amount_needed": 10000,
        "loan_purpose": "personal",
        "total_assets": 0,
        "monthly_debt_payments": 0,
        "income_stable": False if is_unemployed else True,
    }
    return {k: (v if v is not None else defaults[k]) for k, v in {**defaults, **profile}.items()}
