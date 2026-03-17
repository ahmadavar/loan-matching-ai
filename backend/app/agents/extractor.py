"""
Agent 1: Profile Extractor
Parses natural language into a structured borrower profile.
"""
import anthropic
import os
import json


def extract_borrower_profile(user_message: str, pending_field: str = None) -> dict | None:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    context_hint = ""
    if pending_field:
        context_hint = f'\nIMPORTANT: The user is directly answering a question about "{pending_field}". Interpret their response in that context even if it is just a number or short phrase.\n'

    prompt = f"""Extract borrower financial information from this message and return ONLY a valid JSON object.
{context_hint}
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
- loan_purpose mapping:
  - "tooth", "teeth", "dental", "doctor", "hospital", "surgery", "medical", "health", "vision" → "medical"
  - "car", "truck", "vehicle", "auto", "wheels" → "auto"
  - "house", "home", "mortgage", "property", "real estate" → "home"
  - "fix", "repair", "renovate", "remodel" + home context → "home_improvement"
  - "debt", "credit card", "pay off", "consolidate", "bills" → "debt_consolidation"
  - "school", "tuition", "college", "university", "degree" → "education"
  - "business", "startup", "company", "shop", "store" → "business"
  - "trip", "vacation", "travel", "holiday" → "vacation"
  - "rv", "camper", "motorhome", "trailer" → "rv"
- Return ONLY the JSON, no explanation"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    try:
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception:
        return None


def fill_defaults(profile: dict) -> dict:
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
