import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, SessionLocal
from backend.app.models.lender import Base, Lender
from backend.app.data.lenders import LENDERS


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()

    # Clear existing lenders
    db.query(Lender).delete()
    db.commit()

    # Insert all lenders
    for data in LENDERS:
        lender = Lender(**{k: v for k, v in data.items()})
        db.add(lender)

    db.commit()
    db.close()
    print(f"Seeded {len(LENDERS)} lenders successfully.")


if __name__ == "__main__":
    seed()
