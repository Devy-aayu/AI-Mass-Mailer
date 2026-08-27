from __future__ import annotations

import json
import time
import uuid

from app.services.account_store import _connection
from app.db import table_columns


def initialize_campaign_tables() -> None:
    connection = _connection()
    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS campaigns (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                account_id TEXT,
                name TEXT NOT NULL,
                subject TEXT DEFAULT '',
                body TEXT DEFAULT '',
                ai_enabled INTEGER DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'draft',
                total_recipients INTEGER DEFAULT 0,
                sent_count INTEGER DEFAULT 0,
                failed_count INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                started_at INTEGER,
                completed_at INTEGER,
                updated_at INTEGER NOT NULL
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS campaign_leads (
                id TEXT PRIMARY KEY,
                campaign_id TEXT NOT NULL,
                name TEXT DEFAULT '',
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                company TEXT DEFAULT '',
                website TEXT DEFAULT '',
                category TEXT DEFAULT '',
                address TEXT DEFAULT '',
                description TEXT DEFAULT '',
                source_data TEXT DEFAULT '{}',
                status TEXT NOT NULL DEFAULT 'pending',
                error TEXT DEFAULT '',
                sent_at INTEGER,
                sent_subject TEXT DEFAULT '',
                sent_body TEXT DEFAULT '',
                message_id TEXT DEFAULT '',
                sent_from TEXT DEFAULT '',
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
            )
        """)
                                                                                         
        existing_columns = table_columns(connection, "campaign_leads")
        for name, sql_type in (
            ("sent_subject", "TEXT DEFAULT ''"),
            ("sent_body", "TEXT DEFAULT ''"),
            ("message_id", "TEXT DEFAULT ''"),
            ("sent_from", "TEXT DEFAULT ''"),
        ):
            if name not in existing_columns:
                connection.execute(f"ALTER TABLE campaign_leads ADD COLUMN {name} {sql_type}")
        connection.commit()
    finally:
        connection.close()


def create_campaign(*, user_id: str, name: str, account_id: str | None = None) -> dict:
    campaign_id = f"cmp_{uuid.uuid4().hex}"
    now = int(time.time())
    connection = _connection()
    try:
        connection.execute(
            "INSERT INTO campaigns(id,user_id,account_id,name,created_at,updated_at) VALUES(?,?,?,?,?,?)",
            (campaign_id, user_id, account_id, name.strip() or "Untitled Campaign", now, now),
        )
        connection.commit()
    finally:
        connection.close()
    return get_campaign(campaign_id, user_id=user_id)


def get_campaign(campaign_id: str, *, user_id: str) -> dict | None:
    connection = _connection()
    try:
        row = connection.execute("SELECT * FROM campaigns WHERE id=? AND user_id=?", (campaign_id, user_id)).fetchone()
        return dict(row) if row else None
    finally:
        connection.close()


def list_campaigns(user_id: str) -> list[dict]:
    connection = _connection()
    try:
        rows = connection.execute("SELECT * FROM campaigns WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def update_campaign(campaign_id: str, *, user_id: str, **fields) -> dict | None:
    allowed = {"account_id", "name", "subject", "body", "ai_enabled", "status", "total_recipients", "sent_count", "failed_count", "started_at", "completed_at"}
    values = {k: v for k, v in fields.items() if k in allowed}
    if not values:
        return get_campaign(campaign_id, user_id=user_id)
    values["updated_at"] = int(time.time())
    assignments = ", ".join(f"{key}=?" for key in values)
    params = list(values.values()) + [campaign_id, user_id]
    connection = _connection()
    try:
        connection.execute(f"UPDATE campaigns SET {assignments} WHERE id=? AND user_id=?", params)
        connection.commit()
    finally:
        connection.close()
    return get_campaign(campaign_id, user_id=user_id)


def add_leads(campaign_id: str, leads: list[dict]) -> int:
    connection = _connection()
    try:
        for lead in leads:
            connection.execute(
                "INSERT INTO campaign_leads(id,campaign_id,name,email,phone,company,website,category,address,description,source_data) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                (f"lead_{uuid.uuid4().hex}", campaign_id, lead.get("name", ""), lead.get("email", ""), lead.get("phone", ""), lead.get("company", lead.get("business_name", "")), lead.get("website", ""), lead.get("category", ""), lead.get("address", ""), lead.get("description", ""), json.dumps(lead.get("source_data", {}), ensure_ascii=False)),
            )
        connection.commit()
        count_row = connection.execute("SELECT COUNT(*) AS count FROM campaign_leads WHERE campaign_id=? AND email != ''", (campaign_id,)).fetchone()
        count = int(count_row["count"]) if count_row else 0
        connection.execute("UPDATE campaigns SET total_recipients=?, updated_at=? WHERE id=?", (count, int(time.time()), campaign_id))
        connection.commit()
        return count
    finally:
        connection.close()


def list_leads(campaign_id: str) -> list[dict]:
    connection = _connection()
    try:
        rows = connection.execute("SELECT * FROM campaign_leads WHERE campaign_id=? ORDER BY id", (campaign_id,)).fetchall()
        result=[]
        for row in rows:
            item=dict(row)
            item["source_data"] = json.loads(item.get("source_data") or "{}")
            result.append(item)
        return result
    finally:
        connection.close()


def update_lead_delivery(
    campaign_id: str,
    email: str,
    *,
    status: str,
    error: str = "",
    subject: str = "",
    body: str = "",
    message_id: str = "",
    sent_from: str = "",
) -> None:
    connection = _connection()
    try:
        sent_at = int(time.time()) if status == "sent" else None
        connection.execute(
            """
            UPDATE campaign_leads
            SET status=?, error=?, sent_at=?, sent_subject=?, sent_body=?, message_id=?, sent_from=?
            WHERE campaign_id=? AND lower(email)=lower(?)
            """,
            (status, error, sent_at, subject, body, message_id, sent_from, campaign_id, email),
        )
        connection.commit()
    finally:
        connection.close()


def update_lead_status(campaign_id: str, email: str, *, status: str, error: str = "") -> None:
    update_lead_delivery(campaign_id, email, status=status, error=error)
