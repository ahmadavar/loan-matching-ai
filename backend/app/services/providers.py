"""
Lender Data Provider
====================
Single entry point for fetching lender data throughout the app.

Data Pipeline Phases
--------------------
Phase 1 (current): Hardcoded lender profiles seeded into PostgreSQL at startup.
Phase 2 (planned): Engine by Even Financial API — real-time pre-qualified offers.
                   Swap get_lenders() to call the Engine API instead of the DB.
Phase 3 (future):  Hybrid — Engine API for real-time rates, DB for lenders not
                   covered by the aggregator (credit unions, niche lenders, etc.).

To move from Phase 1 → Phase 2, only this file needs to change.
"""

from sqlalchemy.orm import Session
from backend.app.models.lender import Lender


def get_lenders(db: Session) -> list[dict]:
    """
    Return all lenders as a list of dicts.

    Phase 1: reads from PostgreSQL (seeded from lenders.py at startup).
    Phase 2: replace this body with an Engine by Even Financial API call.
    """
    lenders = db.query(Lender).all()
    return [
        {
            c.name if c.name != "metadata" else "metadata_": getattr(l, c.name if c.name != "metadata" else "metadata_")
            for c in Lender.__table__.columns
        }
        for l in lenders
    ]
