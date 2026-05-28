from pathlib import Path
import re

import aiosqlite
import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings


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
        await self.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
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
        return row

    def _convert_query(self, query: str) -> str:
        return re.sub(r"\$\d+", "?", query)


async def init_databases():
    """Initialize PostgreSQL and MongoDB connections"""
    global pg_pool, db_connection, mongo_client, mongo_db

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
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

        db_connection = pg_pool
        print("PostgreSQL initialized")
    except Exception as exc:
        if not settings.database_fallback_to_sqlite:
            raise

        print(f"PostgreSQL unavailable; using local SQLite fallback: {exc}")
        sqlite_path = Path(settings.sqlite_database_path)
        if not sqlite_path.is_absolute():
            sqlite_path = Path(__file__).resolve().parents[1] / sqlite_path
        db_connection = await SQLiteDatabase(str(sqlite_path)).connect()
        print(f"SQLite initialized at {sqlite_path}")

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
        print(f"MongoDB unavailable; continuing without MongoDB: {exc}")


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

