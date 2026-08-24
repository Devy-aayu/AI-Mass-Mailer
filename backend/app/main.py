from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.send import router as send_router
from app.api.gmail import router as gmail_router
from app.api.ai import router as ai_router
from app.api.ai_config import router as ai_config_router
from app.api.accounts import router as accounts_router
from app.api.campaigns import router as campaigns_router
from app.services.user_store import initialize_user_tables
from app.services.account_store import initialize_database
from app.services.ai_store import initialize_ai_tables
from app.services.campaign_store import initialize_campaign_tables
from app.config import FRONTEND_URL, JWT_SECRET, TOKEN_ENCRYPTION_KEY


def validate_required_settings() -> None:
    missing = []
    if not JWT_SECRET or len(JWT_SECRET) < 32:
        missing.append("JWT_SECRET (at least 32 random characters)")
    if not TOKEN_ENCRYPTION_KEY:
        missing.append("TOKEN_ENCRYPTION_KEY (Fernet key)")
    if missing:
        raise RuntimeError(
            "Missing/invalid backend configuration: " + ", ".join(missing) +
            ". Copy .env.example to .env and configure these values before starting the server."
        )


validate_required_settings()

app = FastAPI(title="Ritnav Mailer API", version="2.0.0")


@app.on_event("startup")
def initialize_application_data() -> None:
    # Neon/PostgreSQL may start completely empty. Create the base users table
    # before tables that reference users via foreign keys. Keeping initialization
    # in the startup hook also prevents database queries from running while the
    # Python module is still being imported by Vercel.
    initialize_user_tables()
    initialize_database()
    initialize_ai_tables()
    initialize_campaign_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "https://ritmailer.vercel.app", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(send_router)
app.include_router(gmail_router)
app.include_router(ai_router)
app.include_router(ai_config_router)
app.include_router(accounts_router)
app.include_router(campaigns_router)

@app.get("/")
def root():
    return {"name": "Ritnav Mailer API", "status": "running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
