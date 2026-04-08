# LoanMatch AI — Engineering Decisions & Known Architecture

---

## Scoring System

### Base Score (100 points max)
Six dimensions scored at runtime from user-submitted profile:

| Dimension | Max Points |
|---|---|
| Credit Score | 20 |
| Income + Stability | 20 |
| Assets / Net Worth | 15 |
| Employment Type + Experience | 20 |
| Debt-to-Income Ratio | 15 |
| Loan Purpose Match | 10 |
| **Total** | **100** |

Score is capped at `min(total, 100.0)` before being saved or returned.

### Bonus Dimensions (D7–D9) — Dormant
Three extra scoring dimensions exist in the model but are **not collected from users**:

| Field | Dimension | Purpose |
|---|---|---|
| `income_continuity_months` | D7 (+10 pts) | Months of continuous 1099/gig income — meets 2-year lender standard |
| `payment_behavior_score` | D8 (+10 pts) | Off-bureau payment score 0–100 (utilities, rent) |
| `income_source_count` | D9 (+10 pts) | Number of distinct income sources |

**Why they exist:** Designed to enrich gig/self-employed borrower profiles using external data pipelines (credit bureau alternatives, scraped payment history), not user input. Gig workers look riskier on paper than they are — these dimensions close that gap.

**Current status:** Inferred from existing profile fields via `backend/app/services/enrichment.py` (live as of 2026-04-04):

| Dimension | Inference Logic |
|---|---|
| D7 `income_continuity_months` | `years_at_current_work × 12` for gig/self-employed, 0 for salaried |
| D8 `payment_behavior_score` | 90 if stable + DTI < 20%, 75 if stable + DTI < 36%, 60 if stable, 45 otherwise |
| D9 `income_source_count` | 3 for gig, 2 for self-employed/freelance, 1 for salaried |

Applied in both `/api/match` route and chat orchestrator before scoring runs.

**Next step — Plaid integration (v2b, build now):**

Replace inference with real bank data. Plaid connects to user's bank account (with consent), returns transaction history, income deposits, and payment behavior. Enables accurate D7–D9 without asking users extra questions.

Implementation plan:
1. Add Plaid Link button to `/match` page — "Verify income for better matches" (optional, not required)
2. Backend: exchange public_token → access_token → call `/transactions/get` + `/income/get`
3. Parse deposits → derive D7 (months of consistent income), D8 (recurring payment history), D9 (distinct deposit sources)
4. Replace `enrichment.py` heuristics with Plaid-derived values when available
5. Add `plaid_verified: true` flag to match result → show "Verified" badge in UI
6. Use Plaid sandbox throughout development — no real bank accounts needed

Cost: ~$0.30–0.60/user/month. Sandbox: plaid.com/docs/sandbox (free, no approval).
Trigger: build now, ship when Plaid sandbox demo is solid regardless of lender API status.

---

## Data Pipeline

### match_results Table
- Stores every loan match run (chat or form)
- Schema was initially seeded with 1135 synthetic rows (Dec 2025 – Mar 2026)
- Real user recording began **2026-04-04** after schema migration (ALTER TABLE added 15 missing columns that were silently blocking all inserts since launch)
- All three routers (`matching.py`, `chat.py`, `events.py`) now log full tracebacks on DB write failure

### user_events Table
- Tracks: `page_view`, `match_run`, `chat_message`, `calculator_used`, `contact_submitted`
- Recording since 2026-03-18
- `calculator_used` fires once per session when a valid result is computed

### Daily Health Check Query
```sql
SELECT
    created_at::date                            AS day,
    COUNT(*)                                    AS matches,
    ROUND(AVG(top_lender_score)::numeric, 1)   AS avg_score,
    ROUND(AVG(matches_found)::numeric, 1)      AS avg_lenders
FROM match_results
WHERE created_at >= '2026-04-04'
GROUP BY 1
ORDER BY 1 DESC;
```

---

## APR Estimator
- Uses match score (0–100) to interpolate between `apr_min` and `apr_max` per lender
- Higher score → lower APR (better borrower profile)
- `max_score` parameter set to `100.0` (previously was incorrectly set to `130.0` before score cap was added)

---

## Lender Data Pipeline

### Current status
- 52 lenders total with synthetic eligibility profiles (credit min, income min, employment types, loan types)
- 6 lenders with live-scraped APR data in `data/scraped/rates.json`: Prosper, Avant, Best Egg, Upgrade, Navy Federal, SoFi
- 0 lenders with real-time API data (Engine/Upstart pending approval)
- Priority chain: synthetic baseline → scraped rates → API rates (only APR fields overwritten; eligibility rules always stay from synthetic)

### Next: expand scraped rates to 30 lenders
All 52 lenders publish APR ranges publicly. Expanding `data/scraped/rates.json` to 30 lenders requires no external API approval — just updating JSON from public disclosures. Immediately improves APR credibility across all matches.

Target lenders to add (highest traffic / most recognizable):
LightStream, Marcus, Discover, LendingClub, Happy Money, Payoff, Best Egg (already done), Funding Circle, Kabbage, Earnest, CommonBond, CareCredit, Rocket Mortgage, Better Mortgage, Capital One Auto, Chase Auto

### External API applications — status

| Partner | Product | Applied | Status | Notes |
|---|---|---|---|---|
| Engine by Even Financial | Pre-qualified offer API | Yes | Pending | Real-time offers from 100+ lenders |
| Upstart | Affiliate API | Yes | Pending (up to 5 days) | AI-driven approval for thin-credit |
| Experian Connect | Consumer-permissioned credit data | **No — apply now** | Not started | developer.experian.com — soft pull with user consent |
| Credible | Affiliate/rate API | **No — apply now** | Not started | credible.com/partners — faster approval |
| LendingTree | Affiliate API | **No — apply now** | Not started | lendingtree.com/partners |
| Bankrate | Rate feed | **No — apply now** | Not started | bankrate.com/advertise |

Clean integration point for all APIs: `backend/app/services/providers.py` — only this file changes when any API goes live. No changes to matching engine, scoring, or frontend.

---

## Pre-Match Report Feature

**What it is:** A shareable 1-page summary generated after matching runs. Shows the borrower's profile tier breakdown, why they qualify or don't for each loan category, and 3 specific improvement actions.

**Why build it:**
- Uses entirely existing infrastructure (advisor agent output + match results)
- Creates a shareable artifact (users will screenshot it)
- LinkedIn/social-proof moment — can post example report

**Implementation:**
- New `/report` page in frontend
- Backend: `/api/report` endpoint — runs match + advisor agent, returns structured summary
- Summary fields: credit_tier, income_tier, dti_tier, employment_tier, qualified_categories (list), disqualified_reasons (list), improvement_steps (3 items from advisor agent)
- Render as clean card layout, print-friendly CSS
- No new database tables needed — derives from existing match result + advisor output
