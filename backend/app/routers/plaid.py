from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

router = APIRouter()


class LinkTokenResponse(BaseModel):
    link_token: str


class ExchangeRequest(BaseModel):
    public_token: str
    user_id: str = "anonymous"


@router.post("/plaid/link_token", response_model=LinkTokenResponse)
async def create_link_token(user_id: str = "anonymous"):
    if not os.getenv("PLAID_CLIENT_ID"):
        raise HTTPException(status_code=503, detail="Plaid not configured")
    try:
        from backend.app.services.plaid_service import create_link_token as _create
        token = _create(user_id)
        return {"link_token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plaid/exchange")
async def exchange_token(req: ExchangeRequest):
    if not os.getenv("PLAID_CLIENT_ID"):
        raise HTTPException(status_code=503, detail="Plaid not configured")
    try:
        from backend.app.services.plaid_service import exchange_and_analyze
        result = exchange_and_analyze(req.public_token)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
