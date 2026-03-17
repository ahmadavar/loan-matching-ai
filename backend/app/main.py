from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.app.routers import matching, chat
from backend.app.database import engine
from backend.app.models.lender import Base
from backend.app.models.match_result import MatchResult  # noqa: F401 — ensures table is registered
from dotenv import load_dotenv

load_dotenv()

# Auto-create any missing tables on startup (safe — won't drop existing ones)
Base.metadata.create_all(bind=engine)

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


@app.get("/health")
def health():
    return {"status": "ok"}
