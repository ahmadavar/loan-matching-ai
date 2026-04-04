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

**Future improvement — Plaid integration:**
Replace inference with real bank data. Plaid connects to user's bank account (with consent), returns transaction history, income deposits, and payment behavior. Enables accurate D7–D9 without asking users extra questions. Cost: ~$0.30–0.60/user/month. Trigger: when lender partners start requesting richer borrower profiles.

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
