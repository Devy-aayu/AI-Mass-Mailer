from __future__ import annotations
from urllib.parse import urlencode
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse

from app.auth.dependencies import get_current_user
from app.auth.gmail_oauth import create_authorization_url, exchange_code
from app.config import FRONTEND_URL
from app.services.account_store import create_account, delete_account, list_accounts

router = APIRouter(prefix="/api/gmail", tags=["Gmail"])

@router.get("/connect")
def connect_gmail(user: dict = Depends(get_current_user)):
    return RedirectResponse(create_authorization_url(user["id"]))

@router.get("/callback")
def gmail_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    target = f"{FRONTEND_URL}/settings/accounts"
    if error:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": error}))
    if not code or not state:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": "Missing OAuth response."}))
    try:
        credentials, user_id = exchange_code(code, state)
        from googleapiclient.discovery import build
        service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
        profile = service.users().getProfile(userId="me").execute()
        email = profile.get("emailAddress") or ""
        create_account(
            user_id=user_id, provider="gmail", email=email, display_name="Gmail",
            provider_account_id=email,
            tokens={
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes,
            },
        )
        return RedirectResponse(f"{target}?" + urlencode({"status": "connected", "provider": "gmail", "email": email}))
    except Exception as exc:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": str(exc)}))
