# Ritmailer

Ritmailer is a Next.js + FastAPI mass-mailing application packaged for a **single Vercel deployment**.

## Deployment layout

```text
app/                 Next.js frontend
components/          UI components
lib/                 frontend API client
api/index.py         Vercel FastAPI entrypoint
backend/app/         FastAPI application
requirements.txt     Python dependencies
```

Vercel serves the Next.js app at `/` and the FastAPI application at `/api/*` from the same deployment/origin. This keeps the authentication cookie first-party. citeturn569915search0turn569915search3

See `DEPLOY_VERCEL.md` for the deployment steps.
