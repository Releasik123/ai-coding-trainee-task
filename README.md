# AI Coding Trainee Task

Fullstack test task for a Trainee Dev: AI-Powered Coding position.

- Frontend: Vite, TypeScript, plain CSS, no UI framework.
- Backend: Python FastAPI.
- Auth: Google OAuth2, no database, no persistent server sessions.
- Market data: public Binance WebSocket streams.
- Deployment target: one Render Web Service.

## Public URL

Production target:

```text
https://ai-coding-trainee-task.onrender.com
```

If Render generates another service slug, replace the URL in `APP_BASE_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, and Google OAuth redirect URI.

## Local Setup

Requirements:

- Node.js 22+
- Python 3.12+ or `uv`
- Google OAuth web client credentials

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create `.env` in the repository root:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_STATE_SECRET=replace-with-a-long-random-secret
APP_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
```

Run backend:

```bash
uv run --with-requirements backend/requirements.txt uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Run frontend in another terminal:

```bash
npm --prefix frontend run dev
```

Open:

```text
http://localhost:5173
```

## Google OAuth Setup

In Google Cloud Console:

1. Create or select a project.
2. Configure OAuth consent screen.
3. Create OAuth Client ID with application type `Web application`.
4. Add authorized redirect URIs:

```text
http://localhost:8000/api/auth/google/callback
https://ai-coding-trainee-task.onrender.com/api/auth/google/callback
```

5. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into local `.env` and Render environment variables.

Requested scopes:

```text
openid email profile
```

The backend does not store Google tokens and does not send them to the browser.

## Render Deployment

The repository includes `render.yaml`.

Render build command:

```bash
pip install -r backend/requirements.txt && cd frontend && npm ci && npm run build
```

Render start command:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

Required Render environment variables:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
OAUTH_STATE_SECRET
APP_BASE_URL
FRONTEND_URL
ALLOWED_ORIGINS
```

For the default service name, use:

```text
APP_BASE_URL=https://ai-coding-trainee-task.onrender.com
FRONTEND_URL=https://ai-coding-trainee-task.onrender.com
ALLOWED_ORIGINS=https://ai-coding-trainee-task.onrender.com
```

## Verification

Frontend:

```bash
npm --prefix frontend run build
```

Backend:

```bash
uv run --with-requirements backend/requirements.txt pytest
```

Production acceptance checklist:

- Public URL opens from a clean browser session.
- Hero video autoplays muted.
- Google button opens Google OAuth consent screen.
- OAuth callback returns the success page.
- Crypto prices update through the Binance WebSocket feed.
- GitHub Actions CI passes.
