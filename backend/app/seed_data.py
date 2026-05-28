import json
from pathlib import Path

from app.auth import hash_password


DEFAULT_CATEGORIES = [
    {"name": "Groceries", "type": "expense", "icon": "shopping-cart"},
    {"name": "Rent", "type": "expense", "icon": "house"},
    {"name": "Transport", "type": "expense", "icon": "car"},
    {"name": "Utilities", "type": "expense", "icon": "receipt"},
    {"name": "Entertainment", "type": "expense", "icon": "film"},
    {"name": "Shopping", "type": "expense", "icon": "shopping-bag"},
    {"name": "Healthcare", "type": "expense", "icon": "heart-pulse"},
    {"name": "Goals", "type": "expense", "icon": "piggy-bank"},
    {"name": "Salary", "type": "income", "icon": "banknote-arrow-up"},
    {"name": "Freelance", "type": "income", "icon": "briefcase"},
    {"name": "Other Income", "type": "income", "icon": "wallet"},
]

SEED_FILE = Path(__file__).resolve().parents[1] / "seed" / "seed_data.json"


async def init_finance_schema(db):
    await db.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category_name VARCHAR(120) NOT NULL,
            monthly_limit NUMERIC,
            category_type VARCHAR(20) NOT NULL DEFAULT 'expense',
            category_icon VARCHAR(80),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, category_name)
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            vendor VARCHAR(255) NOT NULL,
            category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            amount NUMERIC NOT NULL,
            date DATE NOT NULL,
            type VARCHAR(20) NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


async def ensure_seed_user(db, username="test_user", password="password123"):
    existing = await db.fetchrow("SELECT id FROM users WHERE username = $1", username)
    if existing:
        return existing["id"]

    inserted = await db.fetchrow(
        """
        INSERT INTO users (username, email, phone_number, avatar_url, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        """,
        username,
        None,
        None,
        None,
        hash_password(password),
    )
    return inserted["id"]


async def ensure_default_categories(db, user_id):
    existing_count = await db.fetchrow("SELECT COUNT(*) AS count FROM categories WHERE user_id = $1", user_id)
    if existing_count and existing_count["count"]:
        return await get_category_map(db, user_id)

    for category in DEFAULT_CATEGORIES:
        await db.execute(
            """
            INSERT INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
            VALUES ($1, $2, $3, $4, $5)
            """,
            user_id,
            category["name"],
            None,
            category["type"],
            category["icon"],
        )

    return await get_category_map(db, user_id)


async def get_category_map(db, user_id):
    rows = await db.fetch("SELECT id, category_name FROM categories WHERE user_id = $1", user_id)
    return {row["category_name"]: row["id"] for row in rows}


async def ensure_seeded_transactions(db, user_id, category_map):
    existing_count = await db.fetchrow("SELECT COUNT(*) AS count FROM transactions WHERE user_id = $1", user_id)
    if existing_count and existing_count["count"]:
        return

    if not SEED_FILE.exists():
        print(f"Seed file not found: {SEED_FILE}")
        return

    transactions = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    inserted = 0
    for item in transactions:
        category_id = category_map.get(item.get("category"))
        if not category_id:
            continue

        await db.execute(
            """
            INSERT INTO transactions (user_id, vendor, category_id, amount, date, type, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            user_id,
            item.get("vendor"),
            category_id,
            item.get("amount", 0),
            item.get("date"),
            item.get("type", "EXPENSE"),
            item.get("notes"),
        )
        inserted += 1

    print(f"Seeded {inserted} transactions for {user_id}")


async def seed_initial_data(db):
    user_id = await ensure_seed_user(db)
    category_map = await ensure_default_categories(db, user_id)
    await ensure_seeded_transactions(db, user_id, category_map)
