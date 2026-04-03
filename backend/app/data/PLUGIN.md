# LoanMatch AI — Data Plugin Guide

## Architecture

All lender data flows through a single loader that applies a 3-tier priority chain:

```
API (live partner data)       ← highest priority
  ↓ overrides
Scraped (public rate pages)
  ↓ overrides
Synthetic (lenders.py)        ← lowest priority, always the fallback
  ↓
loader.get_lenders()          ← what the matching engine always calls
  ↓
matching engine               ← never changes, never knows the source
```

The matching engine in `services/matching.py` always receives the same dict
shape regardless of source. Only numeric/factual values change between sources.

---

## File Structure

```
backend/app/data/
  lenders.py          ← synthetic baseline (52 lenders, full eligibility rules)
  loader.py           ← merge logic, priority chain
  PLUGIN.md           ← this file
  scraped/
    rates.json        ← scraped APR ranges (6 lenders as of April 2026)
  api/
    upstart.json      ← (when approved) live Upstart API data
    engine.json       ← (when approved) Engine by NerdWallet data
    credible.json     ← (when approved) Credible data
```

---

## Lender Dict Shape

Every source must produce dicts with this structure.
Fields marked `[real sources]` are the ones scraped/API data overwrites.

```python
{
    # --- Identity ---
    "name": str,                        # must match exactly across all sources
    "website": str,
    "description": str,

    # --- Eligibility (from synthetic, stable) ---
    "credit_score_min": int,
    "credit_score_preferred": int,
    "min_annual_income": int,
    "self_employed_friendly": bool,
    "loan_amount_min": int,
    "loan_amount_max": int,
    "loan_types": list[str],
    "specializations": list[str],
    "accepted_employment_types": list[str],

    # --- Rates (overwritten by real sources) --- [real sources]
    "apr_min": float | None,            # e.g. 8.99
    "apr_max": float | None,            # e.g. 29.99
    "apr_source": str,                  # "synthetic" | "scraped" | "api"
}
```

---

## How to Add a New Scraped Lender

Add an entry to `scraped/rates.json`:

```json
{
  "name": "SoFi",
  "apr_min": 8.99,
  "apr_max": 29.99,
  "apr_source": "scraped",
  "scraped_url": "https://www.sofi.com/personal-loans/rates/"
}
```

- `name` must exactly match the name in `lenders.py`
- `apr_source` should be `"scraped"`
- Run `python3 scripts/scrape_rates.py` to refresh

---

## How to Add a Live API Source

1. Create `api/<lender_slug>.json` with the partner's response data
2. Include at minimum: `name`, `apr_min`, `apr_max`
3. Set `apr_source` to `"api"`
4. loader.py picks it up automatically — no code changes needed

Example `api/upstart.json`:
```json
[
  {
    "name": "Upstart",
    "apr_min": 7.80,
    "apr_max": 35.99,
    "apr_source": "api"
  }
]
```

---

## How to Use the Loader

Replace any direct import of `LENDERS` with `get_lenders()`:

```python
# Before (synthetic only)
from app.data.lenders import LENDERS

# After (best available data)
from app.data.loader import get_lenders
lenders = get_lenders()
```

---

## Overwritable Fields

Only these fields are overwritten by scraped/API sources.
Everything else stays from synthetic (eligibility rules, loan types, etc.)

```
apr_min
apr_max
apr_source
```

To allow more fields to be overwritten, add them to `_OVERWRITABLE_FIELDS`
in `loader.py`.

---

## Scoring Engine — 9 Dimensions

The matching engine in `services/matching.py` scores each lender out of **130 points**.
Score maps to estimated APR via `estimate_apr()` in the same file.

### Core dimensions (100 pts)
| # | Dimension | Max pts | Hard disqualifier |
|---|---|---|---|
| 1 | Credit score | 20 | Yes — below min |
| 2 | Income + stability | 20 | Yes — too low |
| 3 | Assets / net worth | 15 | No |
| 4 | Employment type + years | 20 | Yes — type not accepted |
| 5 | DTI | 15 | Yes — DTI ≥ 100% |
| 6 | Loan purpose | 10 | Yes — purpose not offered |

### Bonus dimensions for gig/self-employed (30 pts)
These reduce estimated APR by proving actual risk is lower than credit score suggests.
Regulatory basis: Fannie Mae 2yr rule (D7), Experian Boost/CFPB (D8), business concentration risk (D9).

| # | Dimension | Max pts | Input field |
|---|---|---|---|
| 7 | Income continuity (months of 1099) | 10 | `income_continuity_months` |
| 8 | Off-bureau payment behavior (0–100) | 10 | `payment_behavior_score` |
| 9 | Income source diversity (# clients) | 10 | `income_source_count` |

Salaried borrowers receive near-full credit on D7–D9 automatically (employer verifies continuity, single employer is not a risk flag).

### APR estimation formula
```python
estimated_apr = apr_min + (1 - score / 130) * (apr_max - apr_min)
```
Score 130/130 → apr_min (best rate). Score 0/130 → apr_max (worst rate).

---

## Current Data Status (April 2026)

| Lender | Synthetic | Scraped | API |
|---|---|---|---|
| Prosper | ✅ | ✅ **live scraped** | ❌ |
| Avant | ✅ | ✅ **live scraped** | ❌ |
| Best Egg | ✅ | ✅ **live scraped** | ❌ |
| Upgrade | ✅ | ✅ **live scraped** | ❌ |
| Navy Federal CU | ✅ | ✅ **live scraped** | ❌ |
| SoFi | ✅ | ✅ (fallback) | ❌ pending |
| Upstart | ✅ | ✅ (fallback) | ⏳ under review |
| Credible | ✅ | ✅ (fallback) | ⏳ application incomplete |
| Engine by NerdWallet | ✅ | ✅ (fallback) | ⏳ no response yet |
| All others (43) | ✅ | ✅ (fallback) | ❌ |

All 52 lenders have real APR ranges. "fallback" = verified from public rate disclosures (April 2026), not live-scraped.
