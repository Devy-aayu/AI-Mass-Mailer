from __future__ import annotations

from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.config import FRONTEND_URL
from app.services.account_service import create_smtp_account, finish_outlook_oauth, finish_zoho_oauth, list_all_accounts, remove_account, start_oauth, test_smtp_connection

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


class SMTPTestRequest(BaseModel):
    email: str = Field(min_length=3)
    host: str = Field(min_length=1)
    port: int = Field(ge=1, le=65535)
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    security: str = "ssl"


class SMTPCreateRequest(SMTPTestRequest):
    display_name: str = ""


@router.get("")
def get_accounts(user: dict = Depends(get_current_user)):
    return {"success": True, "accounts": list_all_accounts(user["id"])}


@router.get("/connect/{provider}")
def connect_provider(provider: str, user: dict = Depends(get_current_user)):
    provider = provider.strip().lower()
    if provider not in {"outlook", "zoho"}:
        raise HTTPException(status_code=400, detail="Unsupported provider.")
    try:
        return RedirectResponse(start_oauth(provider, user["id"]))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/outlook/callback")
def outlook_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    target = f"{FRONTEND_URL}/settings/accounts"
    if error:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": error}))
    if not code or not state:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": "Missing OAuth response."}))
    try:
        account = finish_outlook_oauth(code, state)
        return RedirectResponse(f"{target}?" + urlencode({"status": "connected", "provider": "outlook", "email": account["email"]}))
    except Exception as exc:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": str(exc)}))


@router.get("/zoho/callback")
def zoho_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    target = f"{FRONTEND_URL}/settings/accounts"
    if error:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": error}))
    if not code or not state:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": "Missing OAuth response."}))
    try:
        account = finish_zoho_oauth(code, state)
        return RedirectResponse(f"{target}?" + urlencode({"status": "connected", "provider": "zoho", "email": account["email"]}))
    except Exception as exc:
        return RedirectResponse(f"{target}?" + urlencode({"status": "error", "message": str(exc)}))


@router.post("/smtp/test")
def smtp_test(payload: SMTPTestRequest, user: dict = Depends(get_current_user)):
    try:
        return test_smtp_connection(**payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/smtp")
def smtp_create(payload: SMTPCreateRequest, user: dict = Depends(get_current_user)):
    try:
        account = create_smtp_account(user_id=user["id"], **payload.model_dump())
        return {"success": True, "account": {k: account[k] for k in ("id", "provider", "email", "display_name")}}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{account_id}")
def delete_account(account_id: str, user: dict = Depends(get_current_user)):
    deleted = remove_account(account_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Email account not found.")
    return {"success": True}
