from __future__ import annotations
from app.providers.base import MailProvider

class GmailProvider(MailProvider):
    provider_name = "gmail"

    def send(self, *, account: dict, recipient: str, subject: str, body: str) -> dict:
        from app.services.gmail_service import send_email
        try:
            return send_email(account=account, recipient=recipient, subject=subject, body=body)
        except Exception as exc:
            return {"success": False, "error": str(exc)}
