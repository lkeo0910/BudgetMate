# BudgetMate Deployment Process

Follow this checklist in order.

## 1. Prepare Local Project

Open PowerShell:

```powershell
cd "C:\Users\Admin\Documents\mobile app"
```

PowerShell may block `npm`. Use:

```powershell
npm.cmd
npx.cmd
```

Check mobile dependencies:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npm.cmd install
npx.cmd expo install --check
```

## 2. Prepare Backend Environment

Create local backend env:

```powershell
cd "C:\Users\Admin\Documents\mobile app"
copy backend\.env.example backend\.env
```

Fill `backend/.env` with real values:

```env
DATABASE_URL=your_supabase_postgres_url
MONGODB_URI=your_mongodb_atlas_uri
REDIS_URL=your_redis_cloud_url
GOOGLE_API_KEY=your_google_api_key
OCR_SPACE_API_KEY=your_ocr_space_api_key
JWT_SECRET_KEY=your_long_random_jwt_secret
CORS_ORIGIN=*
```

Test backend locally:

```powershell
cd "C:\Users\Admin\Documents\mobile app\backend"
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open:

```text
http://localhost:8000/health
```

You should see:

```json
{"ok":true,"service":"budgetmate-api"}
```

## 3. Prepare Mobile Environment

Create mobile env:

```powershell
cd "C:\Users\Admin\Documents\mobile app"
copy mobile\.env.example mobile\.env
```

For testing on your phone with Expo Go:

```env
EXPO_PUBLIC_API_URL=http://192.168.11.107:8000/api/v1
```

Use your laptop IP address. Do not use `localhost` for a physical phone.

Start mobile preview:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo start --lan -c
```

Scan the QR code with Expo Go.

## 4. Set Up Supabase PostgreSQL

1. Open Supabase.
2. Select your BudgetMate project.
3. Go to SQL Editor.
4. Run your schema SQL.
5. Run seed SQL if needed.
6. Copy the Postgres connection string.
7. Use that connection string as `DATABASE_URL` in Render.

Supabase is your main relational database.

## 5. Deploy Backend To Render

1. Push your project to GitHub.
2. Open Render.
3. Create a new Web Service.
4. Connect your GitHub repo.
5. Set Root Directory:

```text
backend
```

6. Set Build Command:

```bash
uv sync --frozen
```

7. Set Start Command:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

8. Add Render environment variables:

```env
DATABASE_URL=your_supabase_postgres_url
MONGODB_URI=your_mongodb_atlas_uri
REDIS_URL=your_redis_cloud_url
GOOGLE_API_KEY=your_google_api_key
OCR_SPACE_API_KEY=your_ocr_space_api_key
JWT_SECRET_KEY=your_long_random_jwt_secret
CORS_ORIGIN=*
```

9. Deploy.

10. Test Render health URL:

```text
https://YOUR_RENDER_SERVICE.onrender.com/health
```

Expected:

```json
{"ok":true,"service":"budgetmate-api"}
```

## 6. Connect Mobile To Render Backend

After Render deploys, update `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

Restart Expo:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo start --lan -c
```

Scan the QR code again.

## 7. Deploy Website To Vercel

Use this step when your real Next.js frontend source is inside `frontend/`.

1. Open Vercel.
2. Import your GitHub repo.
3. Set Root Directory:

```text
frontend
```

4. Add frontend environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

5. Deploy.

Do not add backend secrets to Vercel frontend variables.

## 8. Build Mobile With EAS

Install EAS CLI:

```powershell
npm.cmd install -g eas-cli
```

Log in:

```powershell
eas login
```

Configure EAS:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
eas build:configure
```

Build Android:

```powershell
eas build --platform android
```

Build iOS:

```powershell
eas build --platform ios
```

## 9. Final Checks

Backend:

```powershell
cd "C:\Users\Admin\Documents\mobile app\backend"
uv run python -c "from app.main import app; print(app.title)"
```

Mobile dependencies:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo install --check
```

Mobile bundle:

```powershell
cd "C:\Users\Admin\Documents\mobile app\mobile"
npx.cmd expo export --platform android --output-dir dist-android-test
```

Clean test export:

```powershell
Remove-Item -Recurse -Force dist-android-test
```

## 10. Security Rules

Never put these in mobile or frontend code:

```text
DATABASE_URL
MONGODB_URI
REDIS_URL
JWT_SECRET_KEY
GOOGLE_API_KEY
OCR_SPACE_API_KEY
```

Mobile can only use:

```text
EXPO_PUBLIC_API_URL
```

Frontend can only use public values like:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL
```

