from dataclasses import dataclass
from urllib.parse import urlencode

import httpx

from backend.app.config import Settings


AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
SCOPES = ("openid", "email", "profile")


class OAuthExchangeError(RuntimeError):
    pass


@dataclass(frozen=True)
class GoogleProfile:
    sub: str
    email: str
    name: str
    picture: str | None
    email_verified: bool | None


def build_authorization_url(settings: Settings, state: str) -> str:
    settings.require_google_oauth()
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": " ".join(SCOPES),
            "state": state,
            "include_granted_scopes": "true",
            "prompt": "select_account",
        },
    )

    return f"{AUTH_URL}?{query}"


async def exchange_code_for_profile(settings: Settings, code: str) -> GoogleProfile:
    settings.require_google_oauth()

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_response = await client.post(
            TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )

        if token_response.status_code >= 400:
            raise OAuthExchangeError("Google token exchange failed.")

        token_payload = token_response.json()
        access_token = token_payload.get("access_token")

        if not isinstance(access_token, str) or not access_token:
            raise OAuthExchangeError("Google token response did not include an access token.")

        profile_response = await client.get(
            USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )

        if profile_response.status_code >= 400:
            raise OAuthExchangeError("Google profile request failed.")

    return parse_google_profile(profile_response.json())


def parse_google_profile(payload: object) -> GoogleProfile:
    if not isinstance(payload, dict):
        raise OAuthExchangeError("Google profile payload is invalid.")

    sub = payload.get("sub")
    email = payload.get("email")

    if not isinstance(sub, str) or not isinstance(email, str):
        raise OAuthExchangeError("Google profile is missing required fields.")

    name = payload.get("name")
    picture = payload.get("picture")
    email_verified = payload.get("email_verified")

    return GoogleProfile(
        sub=sub,
        email=email,
        name=name if isinstance(name, str) else email,
        picture=picture if isinstance(picture, str) else None,
        email_verified=email_verified if isinstance(email_verified, bool) else None,
    )

