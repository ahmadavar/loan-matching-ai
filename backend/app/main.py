from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.app.routers import matching
from dotenv import load_dotenv

load_dotenv()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Loan Matching AI", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(matching.router, prefix="/api", tags=["matching"])


@app.get("/health")
def health():
    return {"status": "ok"}
