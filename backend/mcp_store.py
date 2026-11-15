"""SQLite persistence for user-connected MCP servers.

Only the backend touches this database. Tokens live in ``mcp_secrets`` as
Fernet ciphertext; list endpoints never return them.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import time
import uuid
from typing import Any, Iterable

from security import data_dir, decrypt_secret, encrypt_secret

_SCHEMA_LOCK = threading.Lock()
_SCHEMA_READY = False

_SCHEMA = """
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    auth_type TEXT NOT NULL DEFAULT 'none',
    enabled INTEGER NOT NULL DEFAULT 1,
    allow_write INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    last_error TEXT,
    protocol_version TEXT,
    tools_json TEXT NOT NULL DEFAULT '[]',
    tools_updated_at INTEGER,
    oauth_available INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_mcp_servers_user
    ON mcp_servers(user_id);

CREATE TABLE IF NOT EXISTS mcp_secrets (
    server_id TEXT PRIMARY KEY,
    ciphertext TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mcp_oauth_pending (
    state TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    verifier TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT,
    token_endpoint TEXT NOT NULL,
    token_auth_method TEXT NOT NULL DEFAULT 'none',
    redirect_uri TEXT NOT NULL,
    scope TEXT,
    resource TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mcp_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    server_id TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    created_at INTEGER NOT NULL
);
"""

_ALLOWED_UPDATE_FIELDS = {
    "name",
    "enabled",
    "allow_write",
    "status",
    "last_error",
    "protocol_version",
    "tools_json",
    "tools_updated_at",
    "oauth_available",
    "auth_type",
}


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(
        data_dir() / "kael.db",
        timeout=10.0,
        isolation_level=None,
    )
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


def init_db() -> None:
    global _SCHEMA_READY

    if _SCHEMA_READY:
        return

    with _SCHEMA_LOCK:
        if _SCHEMA_READY:
            return

        with _connect() as connection:
            connection.execute("PRAGMA journal_mode = WAL")
            connection.executescript(_SCHEMA)

            columns = {
                row["name"]
                for row in connection.execute(
                    "PRAGMA table_info(mcp_servers)"
                ).fetchall()
            }
            for name, definition in {
                "tools_updated_at": "INTEGER",
                "oauth_available": "INTEGER NOT NULL DEFAULT 0",
            }.items():
                if name not in columns:
                    connection.execute(
                        f"ALTER TABLE mcp_servers ADD COLUMN {name} {definition}"
                    )

        _SCHEMA_READY = True


def _now() -> int:
    return int(time.time())


def _public(row: sqlite3.Row) -> dict[str, Any]:
    tools: list[dict[str, Any]]
    try:
        parsed = json.loads(row["tools_json"] or "[]")
        tools = parsed if isinstance(parsed, list) else []
    except (TypeError, ValueError):
        tools = []

    return {
        "id": row["id"],
        "name": row["name"],
        "url": row["url"],
        "auth_type": row["auth_type"],
        "enabled": bool(row["enabled"]),
        "allow_write": bool(row["allow_write"]),
        "status": row["status"],
        "last_error": row["last_error"],
        "protocol_version": row["protocol_version"],
        "tools": tools,
        "tools_updated_at": row["tools_updated_at"],
        "oauth_available": bool(row["oauth_available"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_servers(user_id: str) -> list[dict[str, Any]]:
    init_db()
    with _connect() as connection:
        rows = connection.execute(
            "SELECT * FROM mcp_servers WHERE user_id = ? "
            "ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return [_public(row) for row in rows]


def get_server(user_id: str, server_id: str) -> dict[str, Any] | None:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM mcp_servers WHERE id = ? AND user_id = ?",
            (server_id, user_id),
        ).fetchone()
    return _public(row) if row else None


def get_server_by_id(server_id: str) -> dict[str, Any] | None:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM mcp_servers WHERE id = ?",
            (server_id,),
        ).fetchone()
    return _public(row) if row else None


def create_server(
    user_id: str,
    *,
    name: str,
    url: str,
    auth_type: str,
) -> dict[str, Any]:
    init_db()
    server_id = f"mcp_{uuid.uuid4().hex}"
    timestamp = _now()

    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO mcp_servers
                (id, user_id, name, url, auth_type, status,
                 created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'new', ?, ?)
            """,
            (
                server_id,
                user_id,
                name,
                url,
                auth_type,
                timestamp,
                timestamp,
            ),
        )

    server = get_server(user_id, server_id)
    assert server is not None
    return server


def update_server(
    user_id: str,
    server_id: str,
    **fields: Any,
) -> dict[str, Any] | None:
    init_db()
    clean = {
        key: value
        for key, value in fields.items()
        if key in _ALLOWED_UPDATE_FIELDS
    }
    if not clean:
        return get_server(user_id, server_id)

    clean["updated_at"] = _now()
    assignments = ", ".join(f"{key} = ?" for key in clean)
    values = list(clean.values()) + [server_id, user_id]

    with _connect() as connection:
        connection.execute(
            f"UPDATE mcp_servers SET {assignments} "
            "WHERE id = ? AND user_id = ?",
            values,
        )

    return get_server(user_id, server_id)


def update_server_result(
    server_id: str,
    *,
    status: str,
    last_error: str | None,
    tools: Iterable[dict[str, Any]] | None = None,
    protocol_version: str | None = None,
    oauth_available: bool | None = None,
) -> None:
    init_db()
    timestamp = _now()

    assignments = [
        "status = ?",
        "last_error = ?",
        "updated_at = ?",
        "tools_updated_at = ?",
    ]
    values: list[Any] = [status, last_error, timestamp, timestamp]

    if tools is not None:
        assignments.append("tools_json = ?")
        values.append(
            json.dumps(list(tools), ensure_ascii=False, separators=(",", ":"))
        )

    if protocol_version is not None:
        assignments.append("protocol_version = ?")
        values.append(protocol_version)

    if oauth_available is not None:
        assignments.append("oauth_available = ?")
        values.append(1 if oauth_available else 0)

    values.append(server_id)

    with _connect() as connection:
        connection.execute(
            f"UPDATE mcp_servers SET {', '.join(assignments)} WHERE id = ?",
            values,
        )


def delete_server(user_id: str, server_id: str) -> bool:
    init_db()
    with _connect() as connection:
        cursor = connection.execute(
            "DELETE FROM mcp_servers WHERE id = ? AND user_id = ?",
            (server_id, user_id),
        )
        connection.execute(
            "DELETE FROM mcp_oauth_pending WHERE server_id = ? AND user_id = ?",
            (server_id, user_id),
        )
    return cursor.rowcount > 0


def save_secret(server_id: str, bundle: dict[str, Any]) -> None:
    init_db()
    ciphertext = encrypt_secret(bundle)
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO mcp_secrets (server_id, ciphertext, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(server_id) DO UPDATE SET
                ciphertext = excluded.ciphertext,
                updated_at = excluded.updated_at
            """,
            (server_id, ciphertext, _now()),
        )


def load_secret(server_id: str) -> dict[str, Any] | None:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT ciphertext FROM mcp_secrets WHERE server_id = ?",
            (server_id,),
        ).fetchone()

    if not row:
        return None

    try:
        return decrypt_secret(row["ciphertext"])
    except ValueError:
        return None


def delete_secret(server_id: str) -> None:
    init_db()
    with _connect() as connection:
        connection.execute(
            "DELETE FROM mcp_secrets WHERE server_id = ?", (server_id,)
        )


def save_oauth_pending(state: str, values: dict[str, Any]) -> None:
    init_db()
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO mcp_oauth_pending
                (state, server_id, user_id, verifier, client_id,
                 client_secret, token_endpoint, token_auth_method,
                 redirect_uri, scope, resource, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                state,
                values["server_id"],
                values["user_id"],
                values["verifier"],
                values["client_id"],
                values.get("client_secret"),
                values["token_endpoint"],
                values.get("token_auth_method", "none"),
                values["redirect_uri"],
                values.get("scope"),
                values.get("resource"),
                _now(),
            ),
        )


def take_oauth_pending(state: str) -> dict[str, Any] | None:
    init_db()
    cutoff = _now() - 900

    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM mcp_oauth_pending WHERE state = ?",
            (state,),
        ).fetchone()
        connection.execute(
            "DELETE FROM mcp_oauth_pending WHERE state = ? OR created_at < ?",
            (state, cutoff),
        )

    return dict(row) if row else None


def audit(
    user_id: str,
    server_id: str | None,
    action: str,
    detail: str | None = None,
) -> None:
    try:
        init_db()
        with _connect() as connection:
            connection.execute(
                """
                INSERT INTO mcp_audit (user_id, server_id, action, detail,
                                       created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, server_id, action, detail, _now()),
            )
            connection.execute(
                "DELETE FROM mcp_audit WHERE id <= "
                "(SELECT MAX(id) - 5000 FROM mcp_audit)"
            )
    except sqlite3.Error:
        # Auditing must never break a user action.
        return
