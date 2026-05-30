import json
from pathlib import Path

from app.auth import hash_password, password_needs_rehash


DEFAULT_CATEGORIES = [
    {"name": "Groceries", "type": "expense", "icon": "cart-outline"},
    {"name": "Rent", "type": "expense", "icon": "home-outline"},
    {"name": "Transport", "type": "expense", "icon": "car-outline"},
    {"name": "Utilities", "type": "expense", "icon": "receipt-outline"},
    {"name": "Entertainment", "type": "expense", "icon": "film-outline"},
    {"name": "Fitness", "type": "expense", "icon": "heart-outline"},
    {"name": "Shopping", "type": "expense", "icon": "bag-outline"},
    {"name": "Healthcare", "type": "expense", "icon": "heart-outline"},
    {"name": "Goals", "type": "expense", "icon": "flag-outline"},
    {"name": "Salary", "type": "income", "icon": "cash-outline"},
    {"name": "Freelance", "type": "income", "icon": "briefcase-outline"},
    {"name": "Other Income", "type": "income", "icon": "wallet-outline"},
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
    await db.execute("""
        CREATE TABLE IF NOT EXISTS hidden_default_categories (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category_name VARCHAR(120) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, category_name)
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS savings_goals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            title VARCHAR(160) NOT NULL,
            target_amount NUMERIC NOT NULL,
            initial_amount NUMERIC NOT NULL DEFAULT 0,
            target_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    try:
        await db.execute("""
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS goal_id INTEGER REFERENCES savings_goals(id) ON DELETE SET NULL
        """)
    except Exception:
        if hasattr(db, "add_column_if_missing"):
            await db.add_column_if_missing(
                "transactions",
                "goal_id",
                "INTEGER REFERENCES savings_goals(id) ON DELETE SET NULL",
            )
    await db.execute("""
        CREATE TABLE IF NOT EXISTS savings_goal_contributions (
            id SERIAL PRIMARY KEY,
            goal_id INTEGER NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
            amount NUMERIC NOT NULL,
            date DATE NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    try:
        await db.execute("""
            ALTER TABLE savings_goal_contributions
            ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL
        """)
    except Exception:
        if hasattr(db, "add_column_if_missing"):
            await db.add_column_if_missing(
                "savings_goal_contributions",
                "transaction_id",
                "INTEGER REFERENCES transactions(id) ON DELETE SET NULL",
            )
    await db.execute("""
        CREATE TABLE IF NOT EXISTS chat_sections (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(120),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            section_id INTEGER NOT NULL REFERENCES chat_sections(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            preferred_currency VARCHAR(20) NOT NULL DEFAULT 'vnd',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS push_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            device_token TEXT NOT NULL,
            platform VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, device_token)
        )
    """)
    for statement in [
        "CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id)",
        "CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_savings_goal_contributions_goal_id ON savings_goal_contributions(goal_id)",
        "CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id)",
    ]:
        await db.execute(statement)


async def ensure_seed_user(db, username="test_user", password="password123"):
    existing = await db.fetchrow("SELECT id, password_hash FROM users WHERE username = $1", username)
    if existing:
        if password_needs_rehash(existing["password_hash"]):
            await db.execute(
                """
                UPDATE users
                SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                """,
                hash_password(existing["password_hash"]),
                existing["id"],
            )
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
    existing_rows = await db.fetch("SELECT category_name FROM categories WHERE user_id = $1", user_id)
    existing_names = {row["category_name"] for row in existing_rows}
    hidden_rows = await db.fetch("SELECT category_name FROM hidden_default_categories WHERE user_id = $1", user_id)
    hidden_names = {row["category_name"] for row in hidden_rows}

    for category in DEFAULT_CATEGORIES:
        if category["name"] in existing_names or category["name"] in hidden_names:
            continue

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
    for username in ("demo_user", "test_user"):
        user_id = await ensure_seed_user(db, username=username)
        category_map = await ensure_default_categories(db, user_id)
        await ensure_seeded_transactions(db, user_id, category_map)
