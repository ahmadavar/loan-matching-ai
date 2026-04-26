from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from backend.app.routers import matching, chat, contact, events, plaid
from backend.app.database import engine
from backend.app.models.lender import Base
from backend.app.models.match_result import MatchResult      # noqa: F401
from backend.app.models.contact import ContactRequest        # noqa: F401
from backend.app.models.user_event import UserEvent          # noqa: F401
from backend.app.models.borrower import BorrowerProfile      # noqa: F401 — registers table so it exists in Railway
from dotenv import load_dotenv

load_dotenv()

# Create any tables that don't exist yet (safe — never drops existing ones)
Base.metadata.create_all(bind=engine)

# Column migrations: ALTER TABLE ... ADD COLUMN IF NOT EXISTS is idempotent.
# Run on every startup to backfill schema changes that create_all can't apply
# to pre-existing tables. Add a line here whenever a new column is added to
# an existing model.
_COLUMN_MIGRATIONS = [
    # match_results — analytics columns added 2026-03-18 after table existed
    "ALTER TABLE match_results ADD COLUMN IF NOT EXISTS outcome VARCHAR",
    "ALTER TABLE match_results ADD COLUMN IF NOT EXISTS state VARCHAR",
    "ALTER TABLE match_results ADD COLUMN IF NOT EXISTS funded_amount FLOAT",
]

with engine.connect() as _conn:
    for _stmt in _COLUMN_MIGRATIONS:
        _conn.execute(text(_stmt))
    _conn.commit()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Loan Matching AI", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://loanmatchai.app",
        "https://www.loanmatchai.app",
        "http://localhost:3000",
        "http://localhost:8501",
    ],
    allow_origin_regex=r"https://.*\.trycloudflare\.com",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matching.router, prefix="/api", tags=["matching"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(contact.router, prefix="/api", tags=["contact"])
app.include_router(events.router, prefix="/api", tags=["events"])
app.include_router(plaid.router, prefix="/api", tags=["plaid"])


@app.get("/health")
def health():
    return {"status": "ok"}
