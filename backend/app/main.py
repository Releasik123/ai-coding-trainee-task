from html import escape
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles

from backend.app.config import get_settings
from backend.app.google_oauth import (
    GoogleProfile,
    OAuthExchangeError,
    build_authorization_url,
    exchange_code_for_profile,
)
from backend.app.security import StateError, create_oauth_state, verify_oauth_state

ROOT_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"
STATE_COOKIE_NAME = "oauth_state_nonce"
STATE_MAX_AGE_SECONDS = 600

settings = get_settings()

app = FastAPI(title="AI Coding Trainee Task")

if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    )

if FRONTEND_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="assets")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/auth/google/login")
async def google_login() -> RedirectResponse:
    try:
        state, payload = create_oauth_state(settings.oauth_state_secret)
        authorization_url = build_authorization_url(settings, state)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    response = RedirectResponse(authorization_url, status_code=302)
    response.set_cookie(
        key=STATE_COOKIE_NAME,
        value=payload.nonce,
        max_age=STATE_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
    )
    return response


@app.get("/api/auth/google/callback", response_class=HTMLResponse)
async def google_callback(
    request: Request,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> HTMLResponse:
    if error:
        return render_auth_error("Google authorization was cancelled or denied.", status_code=400)

    if not code or not state:
        return render_auth_error("Google callback is missing required parameters.", status_code=400)

    try:
        oauth_state = verify_oauth_state(
            state,
            settings.oauth_state_secret,
            max_age_seconds=STATE_MAX_AGE_SECONDS,
        )
    except StateError:
        return render_auth_error("Google authorization state is invalid or expired.", status_code=400)

    if request.cookies.get(STATE_COOKIE_NAME) != oauth_state.nonce:
        return render_auth_error("Google authorization cookie does not match the request.", status_code=400)

    try:
        profile = await exchange_code_for_profile(settings, code)
    except (RuntimeError, OAuthExchangeError):
        return render_auth_error("Google authorization could not be completed.", status_code=502)

    response = render_auth_success(profile)
    response.delete_cookie(STATE_COOKIE_NAME)
    return response


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str) -> Response:
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    requested_file = FRONTEND_DIST / full_path

    if full_path and requested_file.is_file():
        return FileResponse(requested_file)

    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        return HTMLResponse(index_file.read_text(encoding="utf-8"))

    return HTMLResponse(
        """
        <!doctype html>
        <html lang="en">
          <head><meta charset="utf-8"><title>Frontend not built</title></head>
          <body><h1>Frontend build is not available.</h1></body>
        </html>
        """,
        status_code=503,
    )


def render_auth_success(profile: GoogleProfile) -> HTMLResponse:
    picture_html = (
        f'<img class="avatar" src="{escape(profile.picture)}" alt="" />'
        if profile.picture
        else '<div class="avatar avatar--empty" aria-hidden="true"></div>'
    )
    verified = "verified" if profile.email_verified else "not verified"

    return HTMLResponse(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Google sign-in complete</title>
            <style>{auth_page_css()}</style>
          </head>
          <body>
            <main class="auth-card">
              {picture_html}
              <p class="eyebrow">Google OAuth2</p>
              <h1>Sign-in complete</h1>
              <p class="lead">Authenticated as <strong>{escape(profile.email)}</strong>.</p>
              <dl>
                <div><dt>Name</dt><dd>{escape(profile.name)}</dd></div>
                <div><dt>Email status</dt><dd>{verified}</dd></div>
              </dl>
              <a href="/">Back to dashboard</a>
            </main>
          </body>
        </html>
        """,
    )


def render_auth_error(message: str, status_code: int) -> HTMLResponse:
    return HTMLResponse(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Google sign-in failed</title>
            <style>{auth_page_css()}</style>
          </head>
          <body>
            <main class="auth-card auth-card--error">
              <p class="eyebrow">Google OAuth2</p>
              <h1>Sign-in failed</h1>
              <p class="lead">{escape(message)}</p>
              <a href="/">Back to dashboard</a>
            </main>
          </body>
        </html>
        """,
        status_code=status_code,
    )


def auth_page_css() -> str:
    return """
      :root { color: #f7f7f2; background: #080b0e; font-family: Inter, system-ui, sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; }
      .auth-card { width: min(100%, 460px); border: 1px solid rgba(255,255,255,.14); border-radius: 8px;
        background: #0d1215; padding: 32px; box-shadow: 0 24px 80px rgba(0,0,0,.42); }
      .auth-card--error { border-color: rgba(255,107,87,.55); }
      .avatar { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; margin-bottom: 22px; }
      .avatar--empty { background: #35e8a8; }
      .eyebrow { margin: 0 0 10px; color: #f2b84b; font-size: 13px; font-weight: 800; text-transform: uppercase; }
      h1 { margin: 0 0 12px; font-size: 34px; line-height: 1.08; }
      .lead { margin: 0 0 24px; color: rgba(247,247,242,.74); line-height: 1.55; }
      dl { margin: 0 0 26px; display: grid; gap: 12px; }
      dl div { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid rgba(255,255,255,.12); padding-top: 12px; }
      dt { color: rgba(247,247,242,.64); }
      dd { margin: 0; font-weight: 700; text-align: right; }
      a { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 16px;
        border-radius: 8px; background: #f3f0e8; color: #101316; font-weight: 800; text-decoration: none; }
    """
