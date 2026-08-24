# Vercel backend deployment

1. Import this folder as its own Vercel project.
2. Keep the project root at this folder (the folder containing `api/index.py`, `app/`, and `requirements.txt`).
3. Add the variables in `.env.example` under Vercel Project Settings -> Environment Variables for Production.
4. Set `FRONTEND_URL` to the exact frontend origin, including `https://` and without a trailing slash.
5. Set `DATABASE_URL` to the pooled Neon PostgreSQL connection string.
6. Deploy/redeploy after saving the variables.
7. Verify `/health` and `/docs` on the backend Vercel domain.

The frontend must set `NEXT_PUBLIC_API_URL` to this backend URL.
Authentication uses a backend-owned HTTP-only cookie with `Secure` + `SameSite=None` in production. The frontend must use `credentials: include` (already present).

## Ritmailer frontend proxy

The browser should not call this backend directly in production. Deploy the Next.js frontend with:

- `BACKEND_URL=https://<your-fastapi-domain>`
- Remove `NEXT_PUBLIC_API_URL` from the frontend project.

All browser requests go through the frontend `/api/*` proxy. This keeps the session cookie first-party and avoids cross-origin credential/CORS failures during signup and login.

Use PostgreSQL/Neon for `DATABASE_URL` in the backend production environment; do not rely on the serverless filesystem for persistent users or campaigns.
