# BudgetMate Local Development

BudgetMate has a FastAPI backend and an Expo React Native mobile app. For local editing, the easiest setup is to run the mobile app in the browser and use browser mobile view.

## Local URLs

- Backend API: http://localhost:8000
- Backend health check: http://localhost:8000/health
- Mobile app in browser: http://localhost:8081

## First Time Setup

Backend:

```bash
cd backend
uv sync
cp .env.example .env
```

For simple local development, set `backend/.env` like this:

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

For browser testing, set `mobile/.env` like this:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

## Run The App

Open two terminals.

Terminal 1, backend:

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2, mobile web:

```bash
cd mobile
npm run web
```

Then open:

```text
http://localhost:8081
```

Use Chrome DevTools mobile mode or a mobile view extension to preview the app as a phone.

## Where Local Data Is Saved

For this local setup, backend data is saved in:

```text
backend/budgetmate.db
```

That file is a local SQLite database. It is created and updated by the FastAPI backend when `DATABASE_FALLBACK_TO_SQLITE=true`.

The mobile app does not directly save the main database. It calls the backend API, and the backend saves the data.

## Future Hosting

For hosting, do not use the local SQLite file. Use a hosted PostgreSQL database instead, for example Supabase, Render Postgres, Neon, or Railway.

In production, set:

```env
DATABASE_FALLBACK_TO_SQLITE=false
DATABASE_URL=your_hosted_postgres_connection_string
```

Then set the hosted backend API URL in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
```

The app can use the same database structure, but it will not automatically use your local `backend/budgetmate.db` file after hosting. If you want to move local data to production later, you must export/migrate the SQLite data into PostgreSQL.

## Quick Checks

Check backend:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{"ok":true,"service":"budgetmate-api"}
```

If the browser shows Expo JSON instead of the app, restart the mobile server:

```bash
cd mobile
npm run web
```
