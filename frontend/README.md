# Ritmailer frontend

The browser uses same-origin `/api/*` requests. Next.js rewrites those requests to the FastAPI backend.

Set `BACKEND_URL` in the frontend environment to the real FastAPI URL. Example for local development: `http://localhost:8001`.

Do not set `NEXT_PUBLIC_API_URL` for this architecture.
