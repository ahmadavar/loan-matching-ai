import os
import datetime
from typing import Optional
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_get_request import TransactionsGetRequest


def _get_client():
    env = os.getenv("PLAID_ENV", "sandbox")
    host = plaid.Environment.Sandbox if env == "sandbox" else plaid.Environment.Production
    config = plaid.Configuration(
        host=host,
        api_key={"clientId": os.getenv("PLAID_CLIENT_ID", ""), "secret": os.getenv("PLAID_SECRET", "")}
    )
    return plaid_api.PlaidApi(plaid.ApiClient(config))


def create_link_token(user_id: str) -> str:
    client = _get_client()
    req = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="LoanMatch AI",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(client_user_id=user_id)
    )
    resp = client.link_token_create(req)
    return resp["link_token"]


def exchange_and_analyze(public_token: str) -> dict:
    """Exchange public_token, pull 24 months of transactions, derive D7/D8/D9."""
    client = _get_client()

    ex_resp = client.item_public_token_exchange(
        ItemPublicTokenExchangeRequest(public_token=public_token)
    )
    access_token = ex_resp["access_token"]

    end = datetime.date.today()
    start = end - datetime.timedelta(days=730)
    txn_resp = client.transactions_get(
        TransactionsGetRequest(access_token=access_token, start_date=start, end_date=end)
    )
    transactions = txn_resp["transactions"]

    return _derive_dimensions(transactions)


def _derive_dimensions(transactions: list) -> dict:
    import collections

    income_months = set()
    income_sources = set()
    recurring_payments = collections.defaultdict(int)

    for txn in transactions:
        amount = txn.get("amount", 0)
        date = txn.get("date")
        name = txn.get("merchant_name") or txn.get("name", "")
        category = txn.get("category", [])

        if amount < -200:
            if date:
                month_key = f"{date.year}-{date.month}" if hasattr(date, 'year') else str(date)[:7]
                income_months.add(month_key)
            income_sources.add(name[:40])

        if amount > 50 and any(c in str(category) for c in ["Rent", "Utilities", "Insurance", "Service"]):
            recurring_payments[name[:40]] += 1

    d7 = len(income_months)
    d9 = max(len(income_sources), 1)

    recurring_count = sum(1 for v in recurring_payments.values() if v >= 3)
    if recurring_count >= 4:
        d8 = 90.0
    elif recurring_count >= 2:
        d8 = 75.0
    elif recurring_count >= 1:
        d8 = 60.0
    else:
        d8 = 45.0

    return {
        "income_continuity_months": d7,
        "payment_behavior_score": d8,
        "income_source_count": d9,
        "plaid_verified": True,
    }
