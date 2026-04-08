# LoanMatch AI

> **DE Zoomcamp reviewer?** The capstone project (Airflow DAG, dbt models, BigQuery pipeline, Looker Studio dashboard) is documented here: [08-capstone →](https://github.com/ahmadavar/data-engineering-zoomcamp-2026/tree/main/08-capstone)

> An AI-powered loan matching platform built for the people traditional banks ignore — gig workers, freelancers, contractors, and self-employed professionals.

**Live**: [loanmatchai.app](https://www.loanmatchai.app) | **Data Pipeline Docs**: [dbt lineage & models](https://ahmadavar.github.io/loan-matching-ai/)

---

## The Problem

Traditional loan matching platforms evaluate borrowers on a narrow set of criteria: credit score, income, and employment status. This excludes tens of millions of non-traditional workers who are financially stable but don't fit the conventional W-2 mold.

An Uber driver with $70K/year income and 4 years of consistent earnings is a better borrower than many salaried employees — but most platforms reject or deprioritize them at first filter.

## The Solution

LoanMatch AI uses a **multi-dimensional scoring engine** that evaluates borrowers across 6 dimensions and routes their profile through a **multi-agent AI system** to find the best-fit lenders:

| Dimension | What it measures |
|---|---|
| Credit Score | Baseline eligibility threshold |
| Income + Stability | Amount and consistency over 2+ years |
| Assets & Net Worth | Compensating factors for irregular income |
| Employment Type | Gig, freelance, contractor, 1099-aware logic |
| Debt-to-Income Ratio | Real affordability signal |
| Loan Purpose | Lender specialization alignment |

---

## Architecture

```
┌─────────────────────────────────────┐
│   Next.js 14 (App Router)           │  Frontend + BFF
│   TypeScript + Tailwind + shadcn/ui │
└────────────────┬────────────────────┘
                 │ REST API
┌────────────────▼────────────────────┐
│   FastAPI (Python)                  │  AI Microservice
│   Multi-agent orchestration         │
│   Claude Haiku (extraction, advice) │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   PostgreSQL + pgvector             │  Data Layer
│   Redis (sessions + rate limiting)  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   Airflow + dbt + Kafka             │  Data Platform (in progress)
│   Lender ingestion + analytics      │
└─────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI |
| AI | Anthropic Claude API (Haiku), pgvector embeddings |
| Database | PostgreSQL |
| Data Platform | Airflow, dbt, Kafka *(in progress)* |
| Infrastructure | Docker, Railway, GitHub Actions |

---

## Lender Data Pipeline

All lender data flows through a single `get_lenders()` function — swapping phases requires changing only that one file.

### Phase 1 — Static Profiles (current)
52 manually researched lender profiles seeded into PostgreSQL. Covers major banks (Chase, BofA, Wells Fargo), credit unions (Navy Federal, USAA, PenFed), fintechs (SoFi, Upstart, LendingClub), and specialists across personal, auto, home, business, medical, and education loans.

### Phase 2 — Engine by Even Financial API *(integration built, pending partnership approval)*
The integration layer is complete. `providers.py` is the single swap point — replacing `get_lenders()` with an Engine API call delivers real-time pre-qualified offers from 100+ lenders (the same aggregator powering NerdWallet and Credit Karma) with zero changes to the matching engine, scoring logic, or frontend.

**What changes when approved:** only `providers.py`. Everything else is untouched.

**Partnership application submitted.** Engine by Even Financial is a gated partner API — approval in progress.

### Phase 3 — Hybrid (future)
Engine API for real-time rates + DB for niche lenders not covered by the aggregator (CDFIs, microfinance, credit unions).

---

## Multi-Agent AI System

The AI layer was refactored from a single Claude call into a 5-agent orchestrated system:

| Agent | Role |
|---|---|
| Profile Extractor | Parses natural language into structured borrower profile |
| Eligibility Screener | Hard disqualifications before scoring |
| Lender Matcher | 6-dimension scoring engine |
| Explanation Writer | Plain-English verdict per match |
| Improvement Advisor | "Here's what to change to get approved" |

---

## Features

- Conversational AI chat — describe your situation in plain English
- Detailed form for precision matching
- 52+ curated lender profiles across all loan types
- AI-generated advisor verdict per match
- Dimension-by-dimension score breakdown
- Rate limiting + abuse prevention
- Dark mode, mobile-responsive UI

---

## Running Locally

```bash
git clone https://github.com/ahmadavar/loan-matching-ai.git
cd loan-matching-ai

# Backend (FastAPI)
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env  # Add ANTHROPIC_API_KEY

uvicorn backend.app.main:app --reload --port 8000

# Frontend (Next.js)
cd frontend-next
npm install
npm run dev
```

Or with Docker:
```bash
docker compose up
```

---

## API

```
POST /api/match     — Score borrower against all lenders
POST /api/chat      — Conversational profile extraction + matching
GET  /health        — Health check
```

---

## Build Milestones

- [x] Multi-dimensional scoring engine (6 dimensions)
- [x] 52 lender profiles in PostgreSQL
- [x] Conversational AI chat with Claude
- [x] pgvector semantic lender search
- [x] Docker + Railway deployment
- [x] Next.js frontend (replacing Streamlit)
- [x] Multi-agent orchestration (5 agents)
- [x] Engine by Even Financial API integration layer (built — pending partner approval)
- [ ] Airflow lender data pipeline
- [ ] dbt analytics models
- [ ] Kafka event streaming
- [ ] Prometheus + Grafana monitoring

---

*Built by Ahmad — [loanmatchai.app](https://www.loanmatchai.app)*
