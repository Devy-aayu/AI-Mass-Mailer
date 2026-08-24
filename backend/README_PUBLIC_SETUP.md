# Ritnav Mailer — Public Multi-user Setup

## Backend

1. Copy `.env.example` to `.env`.
2. Generate `TOKEN_ENCRYPTION_KEY` with the command in `.env.example`.
3. Generate `JWT_SECRET` with a password manager or the PowerShell command below; it must be at least 32 random characters.

### Windows PowerShell

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the output into `JWT_SECRET=` in `.env`. Do not commit `.env` to Git.
4. Configure the OAuth credentials and redirect URIs for Gmail / Outlook / Zoho that you intend to enable.
5. Install dependencies with `pip install -r requirements.txt`.
6. Start with `uvicorn app.main:app --reload`.

The database is SQLite by default for local/dev convenience. On Vercel/serverless hosting, set `ACCOUNT_DB_PATH` to a writable location such as `/tmp/massmailer/data/accounts.db`; otherwise the app fails when it tries to create the SQLite file in a read-only filesystem. For production, set `DATABASE_URL` to your Neon/PostgreSQL connection string and the backend will use PostgreSQL automatically; SQLite remains a fallback for local development.

## Frontend

Copy `.env.local.example` to `.env.local`, set `NEXT_PUBLIC_API_URL`, then install dependencies and run the Next.js app.

## User behavior

- Every account has its own login session.
- At least one sending mailbox is required before campaign creation/upload.
- Multiple sending mailboxes can be connected to one user.
- Campaigns and leads are stored server-side and are scoped to the authenticated user.
- AI is optional. Without AI configuration, normal manual campaigns continue to work.
- AI generation requires the user's own provider, API key and model. The server never returns the decrypted API key to the frontend.


## Gmail OAuth warning / "unsafe app"

The Google "unsafe" or "unverified app" warning is not caused simply by using your own OAuth client ID and client secret. For a public Gmail integration, configure the Google OAuth consent screen as an External app, add your own account as a test user while the app is in testing, and use the exact redirect URI configured in `GOOGLE_REDIRECT_URI`.

This version requests only `https://www.googleapis.com/auth/gmail.send`; the unnecessary Gmail read scope has been removed. Before allowing arbitrary public users, complete Google's OAuth verification/publishing requirements for the scopes you use. Never expose `GOOGLE_CLIENT_SECRET` or user refresh tokens in the frontend.

## Campaign history

Each persistent campaign stores its recipient records. Successful sends record the exact subject/body, timestamp, sender address, and provider message ID on each recipient. The dashboard can drill down from a campaign to recipients and the exact message sent to a recipient.
