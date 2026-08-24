# Ritmailer — Single Vercel Deployment

Ritmailer is now structured as one Vercel project:

- `app/` — Next.js frontend
- `api/index.py` — FastAPI backend
- `backend/app/` — backend application code
- `requirements.txt` — Python dependencies

Vercel serves `/` with Next.js and `/api/*` with FastAPI on the same origin. This avoids cross-origin authentication-cookie problems. Vercel's current Python/Next.js guidance uses this root-level `api/index.py` + `app/` layout.

## Vercel environment variables

Set these in the Vercel project. Do **not** set `BACKEND_URL` in production.

Required:

- `DATABASE_URL` — Neon/PostgreSQL connection string
- `JWT_SECRET` — at least 32 random characters
- `TOKEN_ENCRYPTION_KEY` — Fernet key

Recommended:

- `FRONTEND_URL=https://YOUR-PROJECT.vercel.app` (or your custom domain)
- `AUTH_COOKIE_SECURE=true`
- `OPENROUTER_API_KEY` and other provider credentials used by your deployment
- Google/Microsoft/Zoho OAuth client settings as needed

After changing environment variables, redeploy.

## Local development — recommended

The closest local reproduction of production is:

```powershell
npm install
npm i -g vercel
vercel dev
```

Then use one URL:

```text
http://localhost:3000
```

API routes are:

```text
http://localhost:3000/api/health
http://localhost:3000/api/auth/me
```

You can also use the traditional two-terminal setup with `npm run dev` + Uvicorn by creating `.env.local` with:

```env
BACKEND_URL=http://localhost:8001
```

Then run FastAPI from `backend/`:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
