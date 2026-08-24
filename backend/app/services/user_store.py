from __future__ import annotations

import time
import uuid

from app.db import get_connection


def _connection():
    return get_connection()


def initialize_user_tables() -> None:
    connection = _connection()

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            """
        )

        connection.commit()

    finally:
        connection.close()


def create_user(
    *,
    email: str,
    name: str,
    password_hash: str,
) -> dict:
    user_id = f"usr_{uuid.uuid4().hex}"

    now = int(
        time.time()
    )

    normalized_email = email.strip().lower()

    connection = _connection()

    try:
        connection.execute(
            """
            INSERT INTO users (
                id,
                email,
                name,
                password_hash,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                normalized_email,
                name.strip(),
                password_hash,
                now,
                now,
            ),
        )

        connection.commit()

    finally:
        connection.close()

    user = get_user(
        user_id
    )

    if not user:
        raise RuntimeError(
            "User was created but could not be read back from the database."
        )

    return user


def get_user(
    user_id: str,
) -> dict | None:
    connection = _connection()

    try:
        row = connection.execute(
            """
            SELECT
                id,
                email,
                name,
                password_hash,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
            """,
            (
                user_id,
            ),
        ).fetchone()

        return (
            dict(row)
            if row
            else None
        )

    finally:
        connection.close()


def get_user_by_email(
    email: str,
) -> dict | None:
    normalized_email = (
        email.strip().lower()
    )

    connection = _connection()

    try:
        row = connection.execute(
            """
            SELECT
                id,
                email,
                name,
                password_hash,
                created_at,
                updated_at
            FROM users
            WHERE email = ?
            """,
            (
                normalized_email,
            ),
        ).fetchone()

        return (
            dict(row)
            if row
            else None
        )

    finally:
        connection.close()