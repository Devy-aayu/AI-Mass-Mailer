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
