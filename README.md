# Loan Matching AI Assistant

An intelligent loan matching platform that goes beyond traditional credit scoring to match borrowers with the right lenders — built for gig workers, freelancers, contractors, and self-employed professionals.

## The Problem

Traditional loan matching platforms evaluate borrowers on a narrow set of criteria: credit score, income, and employment status. This excludes millions of non-traditional workers who are financially stable but don't fit the conventional mold.

## The Solution

Loan Matching AI Assistant uses a multi-dimensional scoring engine that evaluates borrowers across 6 dimensions:

- **Credit Score** — baseline eligibility
- **Income + Stability** — amount and consistency over time
- **Assets & Net Worth** — compensating factors for irregular income
- **Employment Type & Experience** — gig, freelance, contractor-aware
- **Debt-to-Income Ratio** — real affordability signal
- **Loan Purpose** — lender specialization alignment

## Lender Data Pipeline

The platform is architected for progressive data quality improvement. All lender data flows through a single `get_lenders()` function in `backend/app/services/providers.py` — swapping phases requires changing only that one file.

### Phase 1 — Static Profiles (current)
52 manually researched lender profiles seeded into PostgreSQL at startup. Covers major banks (Chase, Bank of America, Wells Fargo, Citi), credit unions (Navy Federal, USAA, PenFed, Alliant), fintech lenders (SoFi, Upstart, LendingClub), and specialists across personal, auto, home, business, medical, and education loans.

### Phase 2 — Engine by Even Financial API (planned)
Replace `get_lenders()` with a call to the [Engine by Even Financial](https://www.engine.tech) API — the same aggregator powering NerdWallet and Credit Karma. This returns real-time pre-qualified offers from 100+ lenders for a given borrower profile, enabling live rates instead of static criteria.

**What changes:** only `providers.py`. The matching engine, scoring logic, and frontend are untouched.

### Phase 3 — Hybrid (future)
Engine API for real-time rate offers + DB for lenders not covered by the aggregator (niche credit unions, CDFI lenders, microfinance). Best of both.

---

## Tech Stack

- **Backend**: Python, FastAPI
- **Frontend**: Streamlit
- **AI**: Anthropic Claude API
- **Database**: PostgreSQL
- **Rate Limiting**: SlowAPI (10 requests/day per IP)

## Features

- Multi-dimensional borrower scoring
- 50+ curated lender profiles
- AI-generated advisor verdict per match
- Rate limiting to prevent abuse
- Clean, responsive UI

## Running Locally

```bash
# Clone the repo
git clone https://github.com/ahmadavar/loan-matching-ai.git
cd loan-matching-ai

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt -r frontend/requirements.txt

# Set environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Start backend
uvicorn backend.app.main:app --reload --port 8000

# Start frontend (new terminal)
streamlit run frontend/app.py
```

## API

```
POST /api/match
```

Request:
```json
{
  "credit_score": 680,
  "annual_income": 60000,
  "employment_type": "gig",
  "years_at_current_work": 3,
  "loan_amount_needed": 20000,
  "loan_purpose": "personal",
  "total_assets": 50000,
  "monthly_debt_payments": 500,
  "income_stable": true
}
```

Response: Ranked list of matched lenders with score breakdown and advisor verdict.
