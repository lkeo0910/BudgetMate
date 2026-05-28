import asyncio
import asyncpg
from app.auth import hash_password
from app.core.config import get_settings


async def create_demo_user():
    """Create demo user in PostgreSQL"""
    settings = get_settings()
    
    try:
        pool = await asyncpg.create_pool(settings.database_url)
        
        # Create table
        async with pool.acquire() as conn:
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
            
            # Delete existing demo user if any
            await conn.execute("DELETE FROM users WHERE username = 'demo_user'")
            
            # Create demo user
            hashed = hash_password("password123")
            user = await conn.fetchrow(
                """
                INSERT INTO users (username, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id, username, email, created_at
                """,
                "demo_user",
                "demo@budgetmate.com",
                hashed
            )
            
            print(f"✓ Demo user created: {user}")
            print(f"  Username: demo_user")
            print(f"  Password: password123")
            print(f"  Email: demo@budgetmate.com")
        
        await pool.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(create_demo_user())
