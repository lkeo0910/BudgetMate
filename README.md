# BudgetMate Mobile App

BudgetMate is a mobile-first budgeting app with an Expo React Native frontend, a FastAPI backend, and SQLite for local development.

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

`test_user` is also seeded for user-isolation testing.

## Setup

Backend:

```bash
cd backend
uv sync
cp .env.example .env
```

Recommended local backend `.env`:

```env
DATABASE_URL=
MONGODB_URI=
REDIS_URL=
JWT_SECRET_KEY=local_dev_secret_change_later
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=43200
CORS_ORIGIN=http://127.0.0.1:8081,http://localhost:8081
DATABASE_FALLBACK_TO_SQLITE=true
SQLITE_DATABASE_PATH=budgetmate.db
UPLOAD_DIR=uploads
MAX_PROFILE_PHOTO_BYTES=5242880
RATE_LIMIT_ENABLED=true
PUSH_PROVIDER=future
```

Mobile:

```bash
cd mobile
npm install
cp .env.example .env
```

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
EXPO_PUBLIC_PUSH_PROVIDER=future
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

Open http://127.0.0.1:8081.

## SQLite Development

SQLite is the active local database. PostgreSQL and MongoDB are optional and are not required to run the app locally.

The SQLite file is:

```text
backend/budgetmate.db
```

Startup is safe to rerun: the backend creates missing tables, adds safe migration columns, adds indexes, and seeds `demo_user` only when needed. It does not wipe existing data.

To reset local data intentionally:

```bash
cd backend
rm -f budgetmate.db
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The database will be recreated and seeded on startup.

## Security Notes

- Passwords are hashed with bcrypt through Passlib.
- Legacy plain-text seed passwords are upgraded to hashes on startup/login.
- JWT bearer tokens protect private routes.
- Backend queries are scoped by `user_id` so users cannot read or modify another user’s transactions, categories, goals, chat sections, profile, or push tokens.
- Sensitive routes have basic in-memory rate limiting.
- CORS is restricted through `CORS_ORIGIN`; do not use `*` for production.
- Backend validation trims and bounds user input, rejects invalid IDs, and returns clean JSON errors.
- Profile photo uploads are stored under `backend/uploads/profile_photos`, accept only JPG/PNG/WEBP, validate image signatures server-side, enforce a 5MB default limit, and avoid user-controlled filenames.

## Push Notification Preparation

Push is prepared but not connected to a production provider yet.

Backend support includes a `push_tokens` table with `user_id`, `device_token`, `platform`, timestamps, and authenticated register/update/delete routes:

```text
GET    /api/v1/users/push-tokens
POST   /api/v1/users/push-tokens
PUT    /api/v1/users/push-tokens
DELETE /api/v1/users/push-tokens
DELETE /api/v1/users/push-tokens/{token_id}
```

Frontend support lives in:

```text
mobile/src/services/pushNotifications.js
```

Connect Expo Notifications, Firebase Cloud Messaging, or APNs there when native push is ready.

## Tests

Backend smoke tests:

```bash
cd backend
uv run python -m unittest discover -s tests
```

The smoke test uses temporary SQLite and covers login, wrong password handling, auth protection, user isolation, categories, transactions, goal-linked transactions, password changes, profile photo validation, push tokens, and chat.

## Optional Production Database

To use PostgreSQL later, set `DATABASE_FALLBACK_TO_SQLITE=false` and provide `DATABASE_URL`. MongoDB can be enabled by setting `MONGODB_URI`; it is optional for local development.

Production should use a strong `JWT_SECRET_KEY`, explicit `CORS_ORIGIN`, durable storage for uploads, and a real push provider.
