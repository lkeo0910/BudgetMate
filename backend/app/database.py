import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings


settings = get_settings()
pg_pool = None
mongo_client = None
mongo_db = None


async def init_databases():
    """Initialize PostgreSQL and MongoDB connections"""
    global pg_pool, mongo_client, mongo_db

    # PostgreSQL
    pg_pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=5,
        max_size=20,
    )
    
    # MongoDB
    mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
    mongo_db = mongo_client["budgetmate"]
    
    # Create user table in PostgreSQL
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
    
    # Create MongoDB collections indexes
    await mongo_db["chat_messages"].create_index("user_id")
    await mongo_db["chat_messages"].create_index("created_at")
    await mongo_db["vectors"].create_index("user_id")
    
    print("✓ Databases initialized")


async def close_databases():
    """Close database connections"""
    global pg_pool, mongo_client
    
    if pg_pool:
        await pg_pool.close()
    
    if mongo_client:
        mongo_client.close()


def get_pg_pool():
    return pg_pool


def get_mongo_db():
    return mongo_db
