from __future__ import annotations

import json
import time
import uuid
from typing import Any

from cryptography.fernet import Fernet

from app.config import TOKEN_ENCRYPTION_KEY
from app.db import get_connection, table_columns


def _get_fernet() -> Fernet:
    if not TOKEN_ENCRYPTION_KEY:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY is not configured.")
    return Fernet(TOKEN_ENCRYPTION_KEY.encode())


def _connection():
    return get_connection()


def initialize_database() -> None:
    connection = _connection()
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS email_accounts (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                provider TEXT NOT NULL,
                email TEXT NOT NULL,
                display_name TEXT DEFAULT '',
                provider_account_id TEXT DEFAULT '',
                token_blob TEXT NOT NULL,
                token_expires_at INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        columns = table_columns(connection, "email_accounts")
        if "user_id" not in columns:
            connection.execute("ALTER TABLE email_accounts ADD COLUMN user_id TEXT")

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS oauth_states (
                state TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                user_id TEXT NOT NULL,
                code_verifier TEXT DEFAULT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )
        oauth_columns = table_columns(connection, "oauth_states")
        if "user_id" not in oauth_columns:
            connection.execute("ALTER TABLE oauth_states ADD COLUMN user_id TEXT")
        if "code_verifier" not in oauth_columns:
            connection.execute("ALTER TABLE oauth_states ADD COLUMN code_verifier TEXT")
        connection.commit()
    finally:
        connection.close()


def _encrypt_tokens(tokens: dict[str, Any]) -> str:
    return _get_fernet().encrypt(json.dumps(tokens).encode()).decode()


def _decrypt_tokens(encrypted: str) -> dict[str, Any]:
    return json.loads(_get_fernet().decrypt(encrypted.encode()).decode())


def create_account(*, user_id: str, provider: str, email: str, display_name: str, provider_account_id: str, tokens: dict[str, Any], token_expires_at: int = 0) -> dict:
    account_id = f"acc_{uuid.uuid4().hex}"
    now = int(time.time())
    connection = _connection()
    try:
        connection.execute(
            """
            INSERT INTO email_accounts
            (id,user_id,provider,email,display_name,provider_account_id,token_blob,token_expires_at,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            """,
            (account_id, user_id, provider, email, display_name, provider_account_id, _encrypt_tokens(tokens), token_expires_at, now, now),
        )
        connection.commit()
    finally:
        connection.close()
    return get_account(account_id, user_id=user_id) or {}


def get_account(account_id: str, *, user_id: str | None = None) -> dict | None:
    connection = _connection()
    try:
        sql = "SELECT * FROM email_accounts WHERE id = ?"
        params: list[Any] = [account_id]
        if user_id is not None:
            sql += " AND user_id = ?"
            params.append(user_id)
        row = connection.execute(sql, params).fetchone()
        if not row:
            return None
        result = dict(row)
        result["tokens"] = _decrypt_tokens(result.pop("token_blob"))
        return result
    finally:
        connection.close()


def list_accounts(user_id: str) -> list[dict]:
    connection = _connection()
    try:
        rows = connection.execute(
            """
            SELECT id,provider,email,display_name,provider_account_id,token_expires_at,created_at,updated_at
            FROM email_accounts WHERE user_id = ? ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def update_tokens(account_id: str, *, user_id: str, tokens: dict[str, Any], token_expires_at: int = 0) -> None:
    connection = _connection()
    try:
        connection.execute(
            "UPDATE email_accounts SET token_blob=?, token_expires_at=?, updated_at=? WHERE id=? AND user_id=?",
            (_encrypt_tokens(tokens), token_expires_at, int(time.time()), account_id, user_id),
        )
        connection.commit()
    finally:
        connection.close()


def delete_account(account_id: str, *, user_id: str) -> bool:
    connection = _connection()
    try:
        cursor = connection.execute("DELETE FROM email_accounts WHERE id=? AND user_id=?", (account_id, user_id))
        connection.commit()
        return cursor.rowcount > 0
    finally:
        connection.close()


def create_oauth_state(provider: str, user_id: str, code_verifier: str | None = None) -> str:
    state = __import__("secrets").token_urlsafe(32)
    connection = _connection()
    try:
        connection.execute(
            "INSERT INTO oauth_states(state,provider,user_id,code_verifier,created_at) VALUES(?,?,?,?,?)",
            (state, provider, user_id, code_verifier, int(time.time())),
        )
        connection.commit()
    finally:
        connection.close()
    return state


def consume_oauth_state(state: str, provider: str) -> str | None:
    details = consume_oauth_state_details(state, provider)
    return details["user_id"] if details else None


def consume_oauth_state_details(state: str, provider: str) -> dict | None:
    connection = _connection()
    try:
        row = connection.execute(
            "SELECT * FROM oauth_states WHERE state=? AND provider=?",
            (state, provider),
        ).fetchone()
        if not row:
            return None
        connection.execute("DELETE FROM oauth_states WHERE state=?", (state,))
        connection.commit()
        if int(time.time()) - int(row["created_at"]) > 600:
            return None
        return {
            "user_id": row["user_id"],
            "code_verifier": row["code_verifier"],
        }
    finally:
        connection.close()
