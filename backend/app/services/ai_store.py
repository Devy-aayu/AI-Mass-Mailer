from __future__ import annotations

import json
import time
import uuid
from typing import Any

from app.services.account_store import _connection, _decrypt_tokens, _encrypt_tokens


def initialize_ai_tables() -> None:
    connection = _connection()
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_configurations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL UNIQUE,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                base_url TEXT DEFAULT '',
                token_blob TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


def get_ai_config(user_id: str) -> dict | None:
    connection = _connection()
    try:
        row = connection.execute("SELECT * FROM ai_configurations WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            return None
        result = dict(row)
        result["credentials"] = _decrypt_tokens(result.pop("token_blob"))
        return result
    finally:
        connection.close()


def save_ai_config(*, user_id: str, provider: str, model: str, base_url: str, api_key: str) -> dict:
    now = int(time.time())
    config_id = f"ai_{uuid.uuid4().hex}"
    blob = _encrypt_tokens({"api_key": api_key})
    connection = _connection()
    try:
        existing = connection.execute("SELECT id FROM ai_configurations WHERE user_id = ?", (user_id,)).fetchone()
        if existing:
            connection.execute(
                "UPDATE ai_configurations SET provider=?, model=?, base_url=?, token_blob=?, updated_at=? WHERE user_id=?",
                (provider, model, base_url, blob, now, user_id),
            )
            config_id = existing["id"]
        else:
            connection.execute(
                "INSERT INTO ai_configurations (id,user_id,provider,model,base_url,token_blob,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
                (config_id, user_id, provider, model, base_url, blob, now, now),
            )
        connection.commit()
    finally:
        connection.close()
    return get_ai_config(user_id)


def delete_ai_config(user_id: str) -> bool:
    connection = _connection()
    try:
        cursor = connection.execute("DELETE FROM ai_configurations WHERE user_id = ?", (user_id,))
        connection.commit()
        return cursor.rowcount > 0
    finally:
        connection.close()
