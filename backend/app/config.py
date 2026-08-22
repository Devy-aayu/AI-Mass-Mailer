from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


# backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# Always load backend/.env regardless of the shell working directory.
load_dotenv(BASE_DIR / ".env")


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
).rstrip("/")


# ---------------------------------------------------------------------------
# Google
# ---------------------------------------------------------------------------

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "",
)

GOOGLE_CLIENT_SECRET = os.getenv(
    "GOOGLE_CLIENT_SECRET",
    "",
)

GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/api/gmail/callback",
)


# ---------------------------------------------------------------------------
# AI
# ---------------------------------------------------------------------------

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY",
    "",
)

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "google/gemma-4-26b-a4b-it:free",
)

OPENROUTER_SITE_URL = os.getenv(
    "OPENROUTER_SITE_URL",
    FRONTEND_URL,
)

OPENROUTER_SITE_NAME = os.getenv(
    "OPENROUTER_SITE_NAME",
    "Ritnav Mailer",
)


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Prefer Neon/PostgreSQL when configured. Otherwise keep SQLite for local
# development and serverless fallback paths.
if DATABASE_URL:
    ACCOUNT_DB_PATH = DATABASE_URL
else:
    # SQLite is writable only in a local filesystem. In serverless environments like
    # Vercel, /var/task is read-only, so we must fall back to a writable temp path.
    # A relative ACCOUNT_DB_PATH should be resolved from the backend directory.
    def _resolve_account_db_path() -> str:
        configured = os.getenv("ACCOUNT_DB_PATH")
        candidate = Path(configured).expanduser() if configured else BASE_DIR / "data" / "accounts.db"
        if not candidate.is_absolute():
            candidate = BASE_DIR / candidate

        try:
            candidate.parent.mkdir(parents=True, exist_ok=True)
            probe = candidate.parent / ".write_test"
            probe.touch(exist_ok=True)
            probe.unlink(missing_ok=True)
            return str(candidate)
        except OSError:
            fallback = Path("/tmp") / "massmailer" / "data" / "accounts.db"
            fallback.parent.mkdir(parents=True, exist_ok=True)
            return str(fallback)


    ACCOUNT_DB_PATH = _resolve_account_db_path()


# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------

TOKEN_ENCRYPTION_KEY = os.getenv(
    "TOKEN_ENCRYPTION_KEY",
    "",
)

JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "",
)

JWT_EXPIRE_MINUTES = os.getenv(
    "JWT_EXPIRE_MINUTES",
    "10080",
)

AUTH_COOKIE_NAME = os.getenv(
    "AUTH_COOKIE_NAME",
    "ritnav_session",
)

AUTH_COOKIE_SECURE = (
    os.getenv(
        "AUTH_COOKIE_SECURE",
        "false",
    ).lower()
    == "true"
)


# ---------------------------------------------------------------------------
# Microsoft
# ---------------------------------------------------------------------------

MICROSOFT_CLIENT_ID = os.getenv(
    "MICROSOFT_CLIENT_ID",
    "",
)

MICROSOFT_CLIENT_SECRET = os.getenv(
    "MICROSOFT_CLIENT_SECRET",
    "",
)

MICROSOFT_REDIRECT_URI = os.getenv(
    "MICROSOFT_REDIRECT_URI",
    "http://localhost:8000/api/accounts/outlook/callback",
)

MICROSOFT_AUTHORITY = os.getenv(
    "MICROSOFT_AUTHORITY",
    "https://login.microsoftonline.com/common",
)

MICROSOFT_SCOPES = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "User.Read",
    "Mail.Send",
]


# ---------------------------------------------------------------------------
# Zoho
# ---------------------------------------------------------------------------

ZOHO_CLIENT_ID = os.getenv(
    "ZOHO_CLIENT_ID",
    "",
)

ZOHO_CLIENT_SECRET = os.getenv(
    "ZOHO_CLIENT_SECRET",
    "",
)

ZOHO_REDIRECT_URI = os.getenv(
    "ZOHO_REDIRECT_URI",
    "http://localhost:8000/api/accounts/zoho/callback",
)

ZOHO_ACCOUNTS_URL = os.getenv(
    "ZOHO_ACCOUNTS_URL",
    "https://accounts.zoho.in",
)

ZOHO_MAIL_URL = os.getenv(
    "ZOHO_MAIL_URL",
    "https://mail.zoho.in",
)

ZOHO_SCOPES = os.getenv(
    "ZOHO_SCOPES",
    "ZohoMail.accounts.READ,ZohoMail.messages.CREATE",
)