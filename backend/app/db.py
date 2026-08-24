<<<<<<< HEAD
from __future__ import annotations

import sqlite3
from typing import Any

from psycopg2.extras import RealDictCursor

from app.config import ACCOUNT_DB_PATH, DATABASE_URL


class _DatabaseConnection:
    def __init__(self, backend: str, connection: Any):
        self.backend = backend
        self._connection = connection

    def execute(self, query: str, params: tuple[Any, ...] | list[Any] | None = None):
        if self.backend == "postgres":
            normalized_query = query.replace("?", "%s")
            cursor = self._connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(normalized_query, tuple(params) if isinstance(params, list) else (params or ()))
            return cursor
        return self._connection.execute(query, params or ())

    def commit(self) -> None:
        self._connection.commit()

    def close(self) -> None:
        self._connection.close()

    def __getattr__(self, name: str) -> Any:
        return getattr(self._connection, name)


def use_postgres() -> bool:
    return bool(DATABASE_URL and DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+psycopg2://")))


def get_connection() -> _DatabaseConnection:
    if use_postgres():
        import psycopg2

        connection = psycopg2.connect(DATABASE_URL, sslmode="require")
        connection.autocommit = False
        return _DatabaseConnection("postgres", connection)

    sqlite_path = str(ACCOUNT_DB_PATH)
    connection = sqlite3.connect(sqlite_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return _DatabaseConnection("sqlite", connection)


def table_columns(connection: Any, table_name: str) -> set[str]:
    if getattr(connection, "backend", "") == "postgres":
        rows = connection.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
            """,
            (table_name,),
        ).fetchall()
        return {str(row["column_name"]) for row in rows}

    rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {str(row["name"]) for row in rows}
=======
from __future__ import annotations

import sqlite3
from typing import Any

from psycopg2.extras import RealDictCursor

from app.config import ACCOUNT_DB_PATH, DATABASE_URL


class _DatabaseConnection:
    def __init__(self, backend: str, connection: Any):
        self.backend = backend
        self._connection = connection

    def execute(self, query: str, params: tuple[Any, ...] | list[Any] | None = None):
        if self.backend == "postgres":
            normalized_query = query.replace("?", "%s")
            cursor = self._connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(normalized_query, tuple(params) if isinstance(params, list) else (params or ()))
            return cursor
        return self._connection.execute(query, params or ())

    def commit(self) -> None:
        self._connection.commit()

    def close(self) -> None:
        self._connection.close()

    def __getattr__(self, name: str) -> Any:
        return getattr(self._connection, name)


def use_postgres() -> bool:
    return bool(DATABASE_URL and DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+psycopg2://")))


def get_connection() -> _DatabaseConnection:
    if use_postgres():
        import psycopg2

        connection = psycopg2.connect(DATABASE_URL, sslmode="require")
        connection.autocommit = False
        return _DatabaseConnection("postgres", connection)

    sqlite_path = str(ACCOUNT_DB_PATH)
    connection = sqlite3.connect(sqlite_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return _DatabaseConnection("sqlite", connection)


def table_columns(connection: Any, table_name: str) -> set[str]:
    if getattr(connection, "backend", "") == "postgres":
        rows = connection.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
            """,
            (table_name,),
        ).fetchall()
        return {str(row["column_name"]) for row in rows}

    rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {str(row["name"]) for row in rows}
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
