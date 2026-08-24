
## Production API proxy

Ritmailer routes browser API calls through the same Next.js origin (`/api/*`). Set `BACKEND_URL` on the frontend deployment to the FastAPI URL. Do not set `NEXT_PUBLIC_API_URL` in production; browser requests should remain same-origin.
