"""Vercel entrypoint for Ritmailer's FastAPI backend.

Vercel serves this FastAPI application from the same deployment and origin as
Next.js. API routes therefore remain /api/... and HTTP-only session cookies are
first-party to the Ritmailer domain.
"""

from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402

__all__ = ["app"]
