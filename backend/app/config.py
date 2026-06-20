import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    google_client_id: str
    google_client_secret: str
    oauth_state_secret: str
    app_base_url: str
    frontend_url: str
    allowed_origins: tuple[str, ...]

    @property
    def google_redirect_uri(self) -> str:
        return f"{self.app_base_url.rstrip('/')}/api/auth/google/callback"

    @property
    def secure_cookies(self) -> bool:
        return self.app_base_url.startswith("https://")

    def require_google_oauth(self) -> None:
        if not self.google_client_id or not self.google_client_secret:
            raise RuntimeError("Google OAuth credentials are not configured.")


@lru_cache
def get_settings() -> Settings:
    app_base_url = os.getenv("APP_BASE_URL", "http://localhost:8000").rstrip("/")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    allowed_origins = parse_allowed_origins(
        os.getenv("ALLOWED_ORIGINS"),
        defaults=(frontend_url, app_base_url),
    )

    return Settings(
        google_client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        google_client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
        oauth_state_secret=os.getenv("OAUTH_STATE_SECRET", "dev-only-change-me"),
        app_base_url=app_base_url,
        frontend_url=frontend_url,
        allowed_origins=allowed_origins,
    )


def parse_allowed_origins(value: str | None, defaults: tuple[str, ...]) -> tuple[str, ...]:
    if not value:
        return tuple(origin for origin in defaults if origin)

    return tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())

