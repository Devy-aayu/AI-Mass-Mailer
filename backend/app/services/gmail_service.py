from __future__ import annotations

import base64
from email.message import EmailMessage

from googleapiclient.discovery import build

from app.services.account_store import get_account, update_tokens
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


def _credentials(account: dict) -> Credentials:
    tokens = account["tokens"]
    creds = Credentials(
        token=tokens.get("token"),
        refresh_token=tokens.get("refresh_token"),
        token_uri=tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=tokens.get("client_id"),
        client_secret=tokens.get("client_secret"),
        scopes=tokens.get("scopes"),
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        account["tokens"].update({"token": creds.token, "refresh_token": creds.refresh_token})
        update_tokens(account["id"], user_id=account["user_id"], tokens=account["tokens"], token_expires_at=0)
    if not creds.valid:
        raise RuntimeError("Gmail credentials are invalid or expired. Reconnect the account.")
    return creds


def send_email(*, account: dict, recipient: str, subject: str, body: str):
    credentials = _credentials(account)
    service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
    message = EmailMessage()
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    result = service.users().messages().send(userId="me", body={"raw": encoded_message}).execute()
    return {"success": True, "message_id": result.get("id")}
