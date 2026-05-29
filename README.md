# BudgetMate Mobile App

BudgetMate is a full-stack mobile-first budgeting app built with an Expo React Native frontend, a FastAPI backend, and a local SQLite database for development.

## Local URLs

- Mobile web app: http://127.0.0.1:8081
- Backend API: http://127.0.0.1:8000
- Health check: http://127.0.0.1:8000/health
- API docs: http://127.0.0.1:8000/docs

## Demo Login

```text
username: demo_user
password: password123
```

`test_user` is also seeded for compatibility, but `demo_user` is the primary demo account.

## Features

- Login/register/logout with JWT auth
- Dashboard, budget, transactions, categories, and reports
- Accounts overview from real transaction data
- Savings goals with contributions recorded as transactions
- BudgetMate AI chat with saved chat sections and transaction-aware replies
- Profile and settings screens
- SQLite seed data for immediate local testing

## Setup

Backend:

```bash
cd backend
uv sync
cp .env.example .env
```

For local SQLite development, use:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/budgetmate
MONGODB_URI=mongodb://127.0.0.1:27017/budgetmate
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET_KEY=local_dev_secret_change_later
CORS_ORIGIN=*
DATABASE_FALLBACK_TO_SQLITE=true
SQLITE_DATABASE_PATH=budgetmate.db
POSTGRES_CONNECT_TIMEOUT=1
MONGODB_REQUIRED=false
MONGODB_SERVER_SELECTION_TIMEOUT_MS=1000
```

Mobile:

```bash
cd mobile
npm install
cp .env.example .env
```

Use:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

## Run

Terminal 1:

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2:

```bash
cd mobile
npm run web
```

Open http://127.0.0.1:8081 in a browser, ideally with DevTools mobile viewport enabled.

## Database

Local data is stored in:

```text
backend/budgetmate.db
```

The backend creates tables and seeds demo data on startup when SQLite fallback is enabled. The app is structured so SQLite can be replaced later with PostgreSQL by changing environment variables and migrating the data.

## Tests

Backend smoke tests:

```bash
cd backend
uv run python -m unittest discover -s tests
```

The smoke test uses a temporary SQLite database and verifies demo login, categories, paginated transactions, savings goals, contributions, and chat.

## Troubleshooting

- If login fails, confirm the backend is running and `mobile/.env` points to `http://127.0.0.1:8000/api/v1`.
- If port `8081` is busy, stop the existing Expo server or run Expo on another port.
- If seeded data looks stale, stop the backend and remove `backend/budgetmate.db`; it will be recreated on the next backend start.
- MongoDB/PostgreSQL connection warnings are expected in local SQLite mode when those services are not running.
