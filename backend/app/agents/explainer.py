"""
Agent 4: Explanation Writer
Generates plain-English verdict for each lender match.
"""
import anthropic
import os
from typing import List, Dict


def explain_matches(borrower: Dict, matches: List[Dict]) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text
