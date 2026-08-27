from __future__ import annotations

from app.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
from app.services.account_store import consume_oauth_state_details, create_oauth_state

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _client_config() -> dict:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise RuntimeError("Google OAuth credentials are not configured.")
    return {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }


def create_flow(state: str | None = None, code_verifier: str | None = None):
    from google_auth_oauthlib.flow import Flow
    return Flow.from_client_config(
        _client_config(),
        scopes=SCOPES,
        state=state,
        redirect_uri=GOOGLE_REDIRECT_URI,
        code_verifier=code_verifier,
        autogenerate_code_verifier=code_verifier is None,
    )


def create_authorization_url(user_id: str) -> str:
                                                                          
                                                                         
    import secrets
    code_verifier = secrets.token_urlsafe(96)
    state = create_oauth_state("gmail", user_id, code_verifier=code_verifier)
    flow = create_flow(state=state, code_verifier=code_verifier)
    url, returned_state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    if returned_state != state:
        raise RuntimeError("Google OAuth state mismatch while initializing the flow.")
    return url


def exchange_code(code: str, state: str):
    details = consume_oauth_state_details(state, "gmail")
    if not details:
        raise ValueError("Missing or expired Gmail OAuth state.")

    flow = create_flow(state=state, code_verifier=details.get("code_verifier"))
    flow.fetch_token(code=code)
    credentials = flow.credentials
    if not credentials:
        raise RuntimeError("Google OAuth returned no credentials.")
    from googleapiclient.discovery import build
    service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
    profile = service.users().getProfile(userId="me").execute()
    email = profile.get("emailAddress") or ""
    if not email:
        raise RuntimeError("Could not determine the Gmail account email.")
    return credentials, details["user_id"]
