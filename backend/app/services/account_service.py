from __future__ import annotations

from app.services.account_store import (
    create_account,
    create_oauth_state,
    delete_account,
    get_account,
    initialize_database,
    list_accounts,
)
from app.providers.outlook import OutlookProvider
from app.providers.smtp import SMTPProvider
from app.providers.zoho import ZohoProvider

initialize_database()


def list_all_accounts(user_id: str) -> list[dict]:
    return [
        {
            "id": account["id"],
            "provider": account["provider"],
            "email": account["email"],
            "display_name": account["display_name"],
            "status": "connected",
        }
        for account in list_accounts(user_id)
    ]


def start_oauth(provider: str, user_id: str) -> str:
    provider = provider.strip().lower()
    state = create_oauth_state(provider, user_id)
    if provider == "outlook":
        return OutlookProvider().authorization_url(state)
    if provider == "zoho":
        return ZohoProvider().authorization_url(state)
    raise RuntimeError(f"OAuth is not implemented for {provider}.")


def finish_outlook_oauth(code: str, state: str) -> dict:
    from app.services.account_store import consume_oauth_state
    user_id = consume_oauth_state(state, "outlook")
    if not user_id:
        raise RuntimeError("Invalid or expired Outlook OAuth state.")
    token_result, info = OutlookProvider().exchange_code(code)
    return create_account(
        user_id=user_id, provider="outlook", email=info["email"],
        display_name=info["display_name"], provider_account_id=info["provider_account_id"],
        tokens=token_result["tokens"], token_expires_at=token_result["expires_at"],
    )


def finish_zoho_oauth(code: str, state: str) -> dict:
    from app.services.account_store import consume_oauth_state
    user_id = consume_oauth_state(state, "zoho")
    if not user_id:
        raise RuntimeError("Invalid or expired Zoho OAuth state.")
    token_result, info = ZohoProvider().exchange_code(code)
    return create_account(
        user_id=user_id, provider="zoho", email=info["email"],
        display_name=info["display_name"], provider_account_id=info["provider_account_id"],
        tokens=token_result["tokens"], token_expires_at=token_result["expires_at"],
    )


def test_smtp_connection(*, host: str, port: int, username: str, password: str, security: str, email: str | None = None) -> dict:
    return SMTPProvider().test_connection(host=host, port=port, username=username, password=password, security=security)


def create_smtp_account(*, user_id: str, email: str, display_name: str, host: str, port: int, username: str, password: str, security: str) -> dict:
    provider = SMTPProvider()
    provider.test_connection(host=host, port=port, username=username, password=password, security=security)
    return create_account(
        user_id=user_id, provider="smtp", email=email, display_name=display_name,
        provider_account_id="", tokens={"host": host, "port": port, "username": username, "password": password, "security": security},
    )


def remove_account(account_id: str, user_id: str) -> bool:
    return delete_account(account_id, user_id=user_id)


def get_send_account(account_id: str, user_id: str) -> dict:
    account = get_account(account_id, user_id=user_id)
    if account is None:
        raise RuntimeError("Email account was not found for the current user.")
    return account
