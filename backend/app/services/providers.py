"""
Lender Data Provider
====================
Single entry point for fetching lender data throughout the app.

Data Pipeline Phases
--------------------
Phase 1 (current): DB lenders (seeded from synthetic) + loader merges scraped/API rates on top.
Phase 2 (planned): Engine by Even Financial API — real-time pre-qualified offers.
                   Drop api/engine.json file — loader picks it up automatically.
Phase 3 (future):  Hybrid — API for real-time rates, DB for lenders not covered by aggregator.

Priority chain (see app/data/PLUGIN.md for full details):
  API > Scraped > Synthetic (DB)

To add a new data source: see backend/app/data/PLUGIN.md
"""

from sqlalchemy.orm import Session
from backend.app.models.lender import Lender
from backend.app.data.loader import get_lenders as _loader_get_lenders


def get_lenders(db: Session) -> list[dict]:
    """
    Return all lenders as a list of dicts with best available rate data applied.

    Reads base lender profiles from PostgreSQL, then applies scraped/API
    rate overrides from the loader priority chain (API > scraped > synthetic).
    """
    # Read base profiles from DB
    db_lenders = db.query(Lender).all()
    db_by_name = {
        l.name: {
            c.name if c.name != "metadata" else "metadata_": getattr(l, c.name if c.name != "metadata" else "metadata_")
            for c in Lender.__table__.columns
        }
        for l in db_lenders
    }

    # Get loader's merged list (synthetic + scraped + API overrides)
    merged = _loader_get_lenders()

    # For each lender in loader output, use DB record as base if available,
    # then apply apr fields from loader (which has the priority chain applied)
    result = []
    for lender in merged:
        name = lender["name"]
        if name in db_by_name:
            base = db_by_name[name]
        else:
            base = lender  # not in DB yet — use loader dict directly

        # Apply rate fields from loader (these carry the priority chain result)
        base["apr_min"] = lender.get("apr_min")
        base["apr_max"] = lender.get("apr_max")
        base["apr_source"] = lender.get("apr_source", "synthetic")

        result.append(base)

    return result
