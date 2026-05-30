from pathlib import Path
import re

import aiosqlite
import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.seed_data import init_finance_schema, seed_initial_data


settings = get_settings()
pg_pool = None
db_connection = None
mongo_client = None
mongo_db = None


class SQLiteDatabase:
    def __init__(self, path: str):
        self.path = path
        self.connection: aiosqlite.Connection | None = None

    async def connect(self):
        self.connection = await aiosqlite.connect(self.path)
        self.connection.row_factory = aiosqlite.Row
        await self.connection.execute("PRAGMA foreign_keys = ON")
        await self.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                phone_number TEXT,
                avatar_url TEXT,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await self._add_column_if_missing("phone_number", "TEXT")
        await self._add_column_if_missing("avatar_url", "TEXT")
        return self

    async def close(self):
        if self.connection:
            await self.connection.close()

    async def execute(self, query: str, *args):
        if not self.connection:
            raise RuntimeError("SQLite database is not connected")

        cursor = await self.connection.execute(self._convert_query(query), args)
        await self.connection.commit()
        return cursor

    async def fetchrow(self, query: str, *args):
        if not self.connection:
            raise RuntimeError("SQLite database is not connected")

        cursor = await self.connection.execute(self._convert_query(query), args)
        row = await cursor.fetchone()
        await cursor.close()
        if not query.lstrip().lower().startswith("select"):
            await self.connection.commit()
        return row

    async def fetch(self, query: str, *args):
        if not self.connection:
            raise RuntimeError("SQLite database is not connected")

        cursor = await self.connection.execute(self._convert_query(query), args)
        rows = await cursor.fetchall()
        await cursor.close()
        return rows

    def _convert_query(self, query: str) -> str:
        converted = re.sub(r"\$\d+", "?", query)
        converted = converted.replace("id SERIAL PRIMARY KEY", "id INTEGER PRIMARY KEY AUTOINCREMENT")
        converted = converted.replace("NUMERIC", "REAL")
        converted = converted.replace("VARCHAR(120)", "TEXT")
        converted = converted.replace("VARCHAR(20)", "TEXT")
        converted = converted.replace("VARCHAR(80)", "TEXT")
        converted = converted.replace("VARCHAR(255)", "TEXT")
        converted = converted.replace("DATE NOT NULL", "TEXT NOT NULL")
        converted = converted.replace("REFERENCES users(id) ON DELETE CASCADE", "REFERENCES users(id) ON DELETE CASCADE")
        return converted

    async def _add_column_if_missing(self, column_name: str, column_type: str):
        await self.add_column_if_missing("users", column_name, column_type)

    async def add_column_if_missing(self, table_name: str, column_name: str, column_type: str):
        if not self.connection:
            raise RuntimeError("SQLite database is not connected")

        cursor = await self.connection.execute(f"PRAGMA table_info({table_name})")
        columns = [row["name"] for row in await cursor.fetchall()]
        await cursor.close()
        if column_name not in columns:
            await self.connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            await self.connection.commit()


async def init_databases():
    """Initialize PostgreSQL and MongoDB connections"""
    global pg_pool, db_connection, mongo_client, mongo_db

    async def use_sqlite():
        sqlite_path = Path(settings.sqlite_database_path)
        if not sqlite_path.is_absolute():
            sqlite_path = Path(__file__).resolve().parents[1] / sqlite_path
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        db_connection = await SQLiteDatabase(str(sqlite_path)).connect()
        print(f"Using SQLite for local development: {sqlite_path}")
        return db_connection

    should_try_postgres = bool(settings.database_url) and not settings.database_fallback_to_sqlite
    if should_try_postgres:
        try:
            pg_pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=1,
                max_size=10,
                timeout=settings.postgres_connect_timeout,
            )

            async with pg_pool.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        email VARCHAR(120),
                        phone_number VARCHAR(50),
                        avatar_url TEXT,
                        password_hash VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)")
                await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT")

            db_connection = pg_pool
            print("Using PostgreSQL database.")
        except Exception:
            if not settings.database_fallback_to_sqlite:
                raise
            db_connection = await use_sqlite()
    else:
        db_connection = await use_sqlite()

    await init_finance_schema(db_connection)
    await seed_initial_data(db_connection)

    if not settings.mongodb_uri:
        mongo_db = None
        print("MongoDB not configured; chat storage uses SQLite.")
        return

    try:
        mongo_client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
        )
        mongo_db = mongo_client.get_default_database(default="budgetmate")
        await mongo_client.admin.command("ping")
        await mongo_db["chat_messages"].create_index("user_id")
        await mongo_db["chat_messages"].create_index("created_at")
        await mongo_db["vectors"].create_index("user_id")
        print("MongoDB initialized")
    except Exception as exc:
        if mongo_client:
            mongo_client.close()
            mongo_client = None
        mongo_db = None
        if settings.mongodb_required:
            raise
        print("MongoDB unavailable; continuing with SQLite-backed local features.")


async def close_databases():
    """Close database connections"""
    global pg_pool, db_connection, mongo_client

    if db_connection and db_connection is not pg_pool:
        await db_connection.close()
    elif pg_pool:
        await pg_pool.close()

    if mongo_client:
        mongo_client.close()


def get_pg_pool():
    return pg_pool


def get_db():
    return db_connection


def get_mongo_db():
    return mongo_db
