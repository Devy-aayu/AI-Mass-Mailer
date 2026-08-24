from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

from app.config import (
    JWT_EXPIRE_MINUTES,
    JWT_SECRET,
)


JWT_ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 310_000


def _secret() -> str:
    secret = JWT_SECRET.strip()

    if not secret:
        raise RuntimeError(
            "JWT_SECRET is not configured."
        )

    if len(secret) < 32:
        raise RuntimeError(
            "JWT_SECRET must contain at least 32 characters."
        )

    return secret


def hash_password(
    password: str,
) -> str:
    if not password:
        raise ValueError(
            "Password cannot be empty."
        )

    salt = os.urandom(16)

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )

    salt_b64 = base64.urlsafe_b64encode(
        salt
    ).decode("ascii")

    digest_b64 = base64.urlsafe_b64encode(
        digest
    ).decode("ascii")

    return (
        f"pbkdf2_sha256$"
        f"{PBKDF2_ITERATIONS}$"
        f"{salt_b64}$"
        f"{digest_b64}"
    )


def verify_password(
    password: str,
    encoded: str,
) -> bool:
    try:
        algorithm, iterations, salt_b64, digest_b64 = (
            encoded.split(
                "$",
                3,
            )
        )

        if algorithm != "pbkdf2_sha256":
            return False

        salt = base64.urlsafe_b64decode(
            salt_b64.encode("ascii")
        )

        expected = base64.urlsafe_b64decode(
            digest_b64.encode("ascii")
        )

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )

        return hmac.compare_digest(
            actual,
            expected,
        )

    except (
        ValueError,
        TypeError,
        UnicodeError,
    ):
        return False


def create_access_token(
    user_id: str,
) -> str:
    now = datetime.now(
        timezone.utc
    )

    expire_minutes = int(
        JWT_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now
        + timedelta(
            minutes=expire_minutes
        ),
    }

    return jwt.encode(
        payload,
        _secret(),
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> str:
    try:
        payload = jwt.decode(
            token,
            _secret(),
            algorithms=[
                JWT_ALGORITHM
            ],
        )

    except jwt.PyJWTError as exc:
        raise ValueError(
            "Invalid or expired session."
        ) from exc

    user_id = payload.get(
        "sub"
    )

    if not user_id:
        raise ValueError(
            "Invalid session subject."
        )

    return str(
        user_id
    )