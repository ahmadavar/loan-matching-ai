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

## Current Data Status (April 2026)

| Lender | Synthetic | Scraped | API |
|---|---|---|---|
| SoFi | ✅ | ✅ (fallback) | ❌ pending |
| LightStream | ✅ | ✅ (fallback) | ❌ |
| Upstart | ✅ | ✅ (fallback) | ⏳ under review |
| LendingClub | ✅ | ✅ (fallback) | ❌ |
| Prosper | ✅ | ✅ live scraped | ❌ |
| Discover | ✅ | ✅ (fallback) | ❌ |
| All others (46) | ✅ | ❌ | ❌ |
