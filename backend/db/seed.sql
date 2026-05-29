-- BudgetMate lightweight SQLite seed reference.
-- The FastAPI app is the source of truth for local seeding:
--   backend/app/seed_data.py creates demo_user, test_user, default categories,
--   and imports transactions from backend/seed/seed_data.json on startup.
--
-- This file is intentionally small and safe to run after backend/db/schema.sql
-- when you want a manual SQL-only bootstrap.

INSERT OR IGNORE INTO users (username, email, phone_number, avatar_url, password_hash)
VALUES
  ('demo_user', NULL, NULL, NULL, '$2b$12$kyOIleHyVvn.exmELoUv1.3EViDjSb6dbKytCOQjLD2NveIro/tHG'),
  ('test_user', NULL, NULL, NULL, '$2b$12$kyOIleHyVvn.exmELoUv1.3EViDjSb6dbKytCOQjLD2NveIro/tHG');

INSERT OR IGNORE INTO user_settings (user_id, preferred_currency)
SELECT id, 'vnd'
FROM users
WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Groceries', NULL, 'expense', 'cart-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Rent', NULL, 'expense', 'home-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Transport', NULL, 'expense', 'car-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Utilities', NULL, 'expense', 'receipt-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Entertainment', NULL, 'expense', 'film-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Fitness', NULL, 'expense', 'heart-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Shopping', NULL, 'expense', 'bag-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Healthcare', NULL, 'expense', 'heart-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Goals', NULL, 'expense', 'flag-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Salary', NULL, 'income', 'cash-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Freelance', NULL, 'income', 'briefcase-outline' FROM users WHERE username IN ('demo_user', 'test_user');

INSERT OR IGNORE INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
SELECT id, 'Other Income', NULL, 'income', 'wallet-outline' FROM users WHERE username IN ('demo_user', 'test_user');
