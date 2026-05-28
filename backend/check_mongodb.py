import asyncio
import sys

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings


async def check_mongodb() -> int:
    settings = get_settings()

    if not settings.mongodb_uri:
        print("MongoDB check failed: MONGODB_URI is not set")
        return 1

    print("MongoDB URI loaded")
    print("Testing MongoDB connection...")

    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
    )

    try:
        ping = await client.admin.command("ping")
        db = client.get_default_database(default="budgetmate")
        collections = await db.list_collection_names()

        print("MongoDB connected successfully")
        print(f"Ping: {ping}")
        print(f"Database: {db.name}")
        print(f"Collections: {collections}")
        return 0
    except Exception as exc:
        print("MongoDB connection failed")
        print(f"Error type: {type(exc).__name__}")
        print(f"Error: {exc}")
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(check_mongodb()))
