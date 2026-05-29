import os
import tempfile
import unittest
from pathlib import Path

os.environ["DATABASE_FALLBACK_TO_SQLITE"] = "true"
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@127.0.0.1:6543/budgetmate"
os.environ["POSTGRES_CONNECT_TIMEOUT"] = "0.1"
os.environ["MONGODB_REQUIRED"] = "false"
os.environ["MONGODB_URI"] = "mongodb://127.0.0.1:27017/budgetmate"
os.environ["MONGODB_SERVER_SELECTION_TIMEOUT_MS"] = "100"
os.environ["REDIS_URL"] = "redis://127.0.0.1:6379"
os.environ["JWT_SECRET_KEY"] = "test_secret"
os.environ["CORS_ORIGIN"] = "*"

db_path = Path(tempfile.gettempdir()) / "budgetmate-test.db"
db_path.unlink(missing_ok=True)
os.environ["SQLITE_DATABASE_PATH"] = str(db_path)

from fastapi.testclient import TestClient

from app.main import app


class BudgetMateApiSmokeTest(unittest.TestCase):
    def test_demo_flow_goals_and_chat(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/health").status_code, 200)

            login = client.post(
                "/api/v1/auth/login",
                json={"username": "demo_user", "password": "password123"},
            )
            self.assertEqual(login.status_code, 200)
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            categories = client.get("/api/v1/users/categories", headers=headers)
            self.assertEqual(categories.status_code, 200)
            self.assertGreaterEqual(len(categories.json()), 10)

            category = client.post(
                "/api/v1/users/categories",
                headers=headers,
                json={"category_name": "Mobile Test", "category_type": "expense", "category_icon": "cart-outline"},
            )
            self.assertEqual(category.status_code, 201)
            category_id = category.json()["id"]

            updated_category = client.put(
                f"/api/v1/users/categories/{category_id}",
                headers=headers,
                json={"monthly_limit": 1000000},
            )
            self.assertEqual(updated_category.status_code, 200)
            self.assertEqual(updated_category.json()["monthly_limit"], 1000000)

            transactions = client.get("/api/v1/transactions/?page=1&size=5", headers=headers)
            self.assertEqual(transactions.status_code, 200)
            self.assertEqual(len(transactions.json()["items"]), 5)

            transaction = client.post(
                "/api/v1/transactions",
                headers=headers,
                json={
                    "vendor": "Mobile Smoke Vendor",
                    "category_id": category_id,
                    "amount": 123000,
                    "date": "2026-05-29",
                    "type": "EXPENSE",
                    "notes": "smoke test",
                },
            )
            self.assertEqual(transaction.status_code, 201)
            transaction_id = transaction.json()["id"]

            updated_transaction = client.put(
                f"/api/v1/transactions/{transaction_id}",
                headers=headers,
                json={"amount": 124000},
            )
            self.assertEqual(updated_transaction.status_code, 200)
            self.assertEqual(updated_transaction.json()["amount"], 124000)

            deleted_transaction = client.delete(f"/api/v1/transactions/{transaction_id}", headers=headers)
            self.assertEqual(deleted_transaction.status_code, 200)

            goal = client.post(
                "/api/v1/users/savings-goals",
                headers=headers,
                json={"title": "Emergency fund", "target_amount": 5000000, "initial_amount": 1000000},
            )
            self.assertEqual(goal.status_code, 201)
            goal_id = goal.json()["id"]

            contribution = client.post(
                f"/api/v1/users/savings-goals/{goal_id}/contributions",
                headers=headers,
                json={"amount": 250000},
            )
            self.assertEqual(contribution.status_code, 201)

            section = client.post("/api/v1/chatbot/sections", headers=headers, json={})
            self.assertEqual(section.status_code, 201)
            chat = client.post(
                "/api/v1/chatbot/chat",
                headers=headers,
                json={"section_id": section.json()["section_id"], "message": "How is my spending?"},
            )
            self.assertEqual(chat.status_code, 200)
            self.assertIn("spending", chat.json()["response"].lower())

            deleted_category = client.delete(f"/api/v1/users/categories/{category_id}", headers=headers)
            self.assertEqual(deleted_category.status_code, 200)


if __name__ == "__main__":
    unittest.main()
