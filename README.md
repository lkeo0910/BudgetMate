# BudgetMate Deployment Guide

BudgetMate is a full-stack app with three deployable surfaces:

- `frontend/` - Next.js website for Vercel. This workspace currently only has `frontend/.env.example`; place the real website source here if it is not already present.
- `backend/` - Python FastAPI API for Render.
- `mobile/` - React Native Expo app, upgraded to Expo SDK 54 for Expo Go and EAS Build.

The mobile app is native React Native, not a WebView.

## 1. Local Environment Files

Never commit real secrets. Copy the example files and fill values locally or in each hosting provider dashboard.

Backend:

```powershell
copy backend\.env.example backend\.env
```

Required backend variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/DATABASE?retryWrites=true&w=majority
REDIS_URL=redis://default:PASSWORD@HOST:PORT
GOOGLE_API_KEY=your_google_api_key_here
OCR_SPACE_API_KEY=your_ocr_space_api_key_here
JWT_SECRET_KEY=your_long_random_jwt_secret_here
CORS_ORIGIN=*
```

Mobile:

```powershell
copy mobile\.env.example mobile\.env
```

For Expo Go on your physical phone, use your laptop LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.11.107:8000/api/v1
```

For production mobile builds, set this to your Render API URL:

```env
EXPO_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

Frontend:

```powershell
copy frontend\.env.example frontend\.env.local
```

Frontend variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
```

Only `EXPO_PUBLIC_*` belongs in the mobile app. Only `NEXT_PUBLIC_*` belongs in the frontend. Do not put database URLs, Redis URLs, MongoDB URIs, JWT secrets, or API keys in mobile/frontend public env files.

## 2. Run Locally

PowerShell may block `npm` because of `npm.ps1`. Use `npm.cmd` and `npx.cmd`.

Backend:

```powershell
cd "C:\Users\Admin\Documents\mobile app\backend"
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Mobile:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npm.cmd install
npx.cmd expo start --lan -c
```

Scan the QR code with Expo Go. This app uses Expo SDK 54, matching Expo Go client version `1017756`.

Optional web preview:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo start --web
```

## 3. Supabase PostgreSQL

Use Supabase PostgreSQL as the main relational database.

1. Open Supabase SQL Editor.
2. Run your schema SQL.
3. Run your seed SQL if needed.
4. Use the Supabase Postgres connection string as `DATABASE_URL` in Render and local `backend/.env`.

MongoDB Atlas is only for MongoDB-related AI/chat/vector memory. Redis Cloud is for cache and temporary data.

## 4. Deploy Backend To Render

Create a new Render Web Service:

- Root directory: `backend`
- Runtime: Python
- Build command:

```bash
uv sync --frozen
```

- Start command:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Add Render environment variables:

```env
DATABASE_URL=your_supabase_postgres_connection_string
MONGODB_URI=your_mongodb_atlas_uri
REDIS_URL=your_redis_cloud_url
GOOGLE_API_KEY=your_google_api_key
OCR_SPACE_API_KEY=your_ocr_space_api_key
JWT_SECRET_KEY=your_long_random_jwt_secret
CORS_ORIGIN=*
```

After deploy, test:

```text
https://YOUR_RENDER_SERVICE.onrender.com/health
```

Expected response:

```json
{"ok":true,"service":"budgetmate-api"}
```

## 5. Deploy Website To Vercel

Use this when the real Next.js frontend source is in `frontend/`.

1. Push the repo to GitHub.
2. In Vercel, import the repo.
3. Set Root Directory to `frontend`.
4. Add environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
```

5. Deploy.

If the frontend calls the backend, add a public API URL variable in the frontend, for example:

```env
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

## 6. Preview And Build Mobile

Expo Go preview:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo start --lan -c
```

Production API URL for mobile:

```env
EXPO_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

EAS setup:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npm.cmd install -g eas-cli
eas login
eas build:configure
```

Android build:

```powershell
eas build --platform android
```

iOS build:

```powershell
eas build --platform ios
```

## 7. Verification Commands

Check Expo dependencies:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo install --check
```

Bundle Android:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo export --platform android --output-dir dist-android-test
```

Bundle web:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo export --platform web --output-dir dist-web-test
```

Check backend import:

```powershell
cd "C:\Users\Admin\Documents\mobile app\backend"
uv run python -c "from app.main import app; print(app.title)"
```

## 8. Current Status

- Expo SDK 54 dependencies are installed and checked.
- Android and web exports have bundled successfully.
- FastAPI import check passes.
- `.env`, `.env.local`, logs, caches, `node_modules`, and Python bytecode are ignored by git.
