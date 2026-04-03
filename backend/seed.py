import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, SessionLocal
from backend.app.models.lender import Base, Lender
from backend.app.models.match_result import MatchResult  # noqa: F401 — registers table
from backend.app.data.loader import get_lenders
from backend.app.models.lender import Lender as LenderModel

LENDERS = get_lenders()

# Only pass columns that exist in the DB model — loader adds extra fields (apr_min etc.)
# that aren't in the schema yet. This filters them out safely.
_LENDER_COLUMNS = {c.name if c.name != "metadata" else "metadata_"
                   for c in LenderModel.__table__.columns
                   if c.name != "id"}


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()

    # Skip seeding if lenders already exist (idempotent)
    existing = db.query(Lender).count()
    if existing > 0:
        print(f"Lenders already seeded ({existing} records). Skipping.")
        db.close()
        return

    try:
        for data in LENDERS:
            lender = Lender(**{k: v for k, v in data.items() if k in _LENDER_COLUMNS})
            db.add(lender)
        db.commit()
        print(f"Seeded {len(LENDERS)} lenders successfully.")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
