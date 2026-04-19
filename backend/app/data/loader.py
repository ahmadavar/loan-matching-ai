"""
Data Loader — LoanMatch AI
==========================

Priority chain (highest to lowest):
  1. API       — live data from approved partner APIs (Upstart, Engine, etc.)
  2. Scraped   — real APR ranges scraped from public lender pages
  3. Synthetic — baseline lender profiles in lenders.py

Rules:
  - Structure NEVER changes between sources. All three share the same dict shape.
  - Only numeric/factual values are overwritten (apr_min, apr_max, etc.)
  - Eligibility logic fields (credit_score_min, loan_types, etc.) stay from synthetic
    unless the API source provides them explicitly.
  - The matching engine (services/matching.py) always receives the same shape — it
    does not know or care which source provided the data.

Adding a new source:
  - Scraped: add lender entry to backend/app/data/scraped/rates.json
  - API:     add lender JSON file to backend/app/data/api/<lender_slug>.json
             File must contain a list of dicts with at least {"name": "...", "apr_min": ..., "apr_max": ...}

File locations:
  - backend/app/data/lenders.py          ← synthetic baseline (52 lenders)
  - backend/app/data/scraped/rates.json  ← scraped APR overrides
  - backend/app/data/api/*.json          ← live API overrides (one file per partner)
"""

import json
import os
from typing import List, Dict
from copy import deepcopy

try:
    from backend.app.data.lenders import LENDERS
    from backend.app.data.affiliate_links import AFFILIATE_LINKS
except ModuleNotFoundError:
    from app.data.lenders import LENDERS
    from app.data.affiliate_links import AFFILIATE_LINKS

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_DATA_DIR = os.path.dirname(__file__)
_SCRAPED_RATES_PATH = os.path.join(_DATA_DIR, "scraped", "rates.json")
_API_DIR = os.path.join(_DATA_DIR, "api")


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def _load_scraped() -> Dict[str, dict]:
    """Returns {lender_name: {apr_min, apr_max, ...}} from scraped/rates.json"""
    if not os.path.exists(_SCRAPED_RATES_PATH):
        return {}
    with open(_SCRAPED_RATES_PATH) as f:
        records = json.load(f)
    return {r["name"]: r for r in records}


def _load_api() -> Dict[str, dict]:
    """
    Returns {lender_name: {apr_min, apr_max, ...}} from api/*.json files.
    Each file can contain a single dict or a list of dicts.
    """
    api_data = {}
    if not os.path.isdir(_API_DIR):
        return api_data
    for filename in os.listdir(_API_DIR):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(_API_DIR, filename)
        with open(filepath) as f:
            records = json.load(f)
        if isinstance(records, dict):
            records = [records]
        for r in records:
            if "name" in r:
                api_data[r["name"]] = r
    return api_data


# ---------------------------------------------------------------------------
# Merge logic
# ---------------------------------------------------------------------------

# Fields that real sources are allowed to overwrite on the synthetic base.
# Add more fields here as APIs provide richer data.
_OVERWRITABLE_FIELDS = {"apr_min", "apr_max", "apr_source"}


def _merge(base: dict, override: dict) -> dict:
    """
    Merge override into base, updating only _OVERWRITABLE_FIELDS.
    Returns a new dict — never mutates the originals.
    """
    merged = deepcopy(base)
    for field in _OVERWRITABLE_FIELDS:
        if field in override:
            merged[field] = override[field]
    return merged


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_lenders() -> List[dict]:
    """
    Returns the full lender list with best available data applied.

    Priority: API > scraped > synthetic
    """
    scraped = _load_scraped()
    api = _load_api()

    result = []
    for lender in LENDERS:
        name = lender["name"]
        base = deepcopy(lender)

        # Default source tag
        base.setdefault("apr_min", None)
        base.setdefault("apr_max", None)
        base.setdefault("apr_source", "synthetic")

        # Apply scraped if available
        if name in scraped:
            base = _merge(base, scraped[name])

        # Apply API on top (highest priority — overwrites scraped)
        if name in api:
            base = _merge(base, api[name])

        base["affiliate_url"] = AFFILIATE_LINKS.get(name)
        result.append(base)

    return result
