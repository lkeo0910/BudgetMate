# BudgetMate Mobile Quickstart

This app is an Expo React Native mobile app. For local development, you can run it in the browser and use mobile view in DevTools.

## Local Testing In Browser

Open two terminals from the project root.

Terminal 1, start the backend:

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

Terminal 2, start the mobile web app:

```bash
cd mobile
npm run web
npx expo start --tunnel -c
```

Open:

```text
http://localhost:8081
```

Backend API:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

## Local Environment

For local browser testing, `mobile/.env` should be:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
EXPO_PUBLIC_PUSH_PROVIDER=future
```

For local backend testing without Docker/PostgreSQL, `backend/.env` should have:

```env
DATABASE_URL=
MONGODB_URI=
DATABASE_FALLBACK_TO_SQLITE=true
SQLITE_DATABASE_PATH=budgetmate.db
JWT_SECRET_KEY=local_dev_secret_change_later
CORS_ORIGIN=http://127.0.0.1:8081,http://localhost:8081
```

Local data is saved in:

```text
backend/budgetmate.db
```

## Test Login

The demo account is:

```text
username: demo_user
password: password123
```

`test_user` is also seeded for compatibility, but `demo_user` is the primary account used by the live website and the local mobile app.

New accounts can register and login, but they start with no transactions or finance data. That is expected.

## Main Local Features

- Dashboard, budget, transactions, categories, and reports
- Accounts overview from transaction data
- Savings goals, separate goal creation, and transaction-linked goal progress
- BudgetMate AI chat
- Profile details, change password, and profile photo upload
- Calendar date range picker on dashboard and reports
- Future-ready push token registration API and mobile service placeholder

## Tests

From the backend folder:

```bash
uv run python -m unittest discover -s tests
```

## Create Account Notes

Signup rules:

- username must be at least 3 characters
- password must be at least 8 characters and include a letter, number, and special character
- confirm password must match password
- username must not already exist

If account creation fails, check that the backend is running on port `8000` and that `mobile/.env` points to:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

## Production Setup

For production, use a hosted PostgreSQL database. Do not use the local SQLite file.

Backend production environment:

```env
DATABASE_FALLBACK_TO_SQLITE=false
DATABASE_URL=your_hosted_postgres_connection_string
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET_KEY=your_real_secret_key
CORS_ORIGIN=https://your-mobile-web-domain.com
```

Mobile production environment:

```env
EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
```

The app can use the same backend code and database tables in production, but it will not automatically copy local data from `backend/budgetmate.db`. If you want the local data in production, migrate it from SQLite to PostgreSQL.

PostgreSQL and MongoDB are optional for local development. With the local `.env` above, the backend uses SQLite directly and logs `Using SQLite for local development.` Push notification storage is prepared, but a real Expo Notifications, FCM, or APNs provider still needs to be connected for production push delivery.

## Expo Go On A Real Phone

If testing with Expo Go instead of the browser, use your computer or Codespace forwarded URL instead of `127.0.0.1`.

Example for a computer on WiFi:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8000/api/v1
```

Then run:

```bash
cd mobile
npm start -- --lan
```

Scan the QR code with Expo Go.

## Android Or iOS Production Builds

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login:

```bash
eas login
```

Build Android:

```bash
eas build --platform android
```

Build iOS:

```bash
eas build --platform ios
```
