from fastapi.testclient import TestClient

from backend.app import main
from backend.app.google_oauth import GoogleProfile
from backend.app.security import create_oauth_state


def test_google_callback_rejects_cookie_mismatch() -> None:
    client = TestClient(main.app)
    state, _ = create_oauth_state(main.settings.oauth_state_secret)
    client.cookies.set(main.STATE_COOKIE_NAME, "wrong")

    response = client.get(
        "/api/auth/google/callback",
        params={"code": "code", "state": state},
    )

    assert response.status_code == 400
    assert "cookie does not match" in response.text


def test_google_callback_success_deletes_state_cookie(monkeypatch) -> None:
    async def fake_exchange_code_for_profile(settings, code):  # noqa: ANN001
        assert code == "code"
        return GoogleProfile(
            sub="123",
            email="tester@example.com",
            name="Test User",
            picture=None,
            email_verified=True,
        )

    monkeypatch.setattr(main, "exchange_code_for_profile", fake_exchange_code_for_profile)

    client = TestClient(main.app)
    state, payload = create_oauth_state(main.settings.oauth_state_secret)
    client.cookies.set(main.STATE_COOKIE_NAME, payload.nonce)

    response = client.get(
        "/api/auth/google/callback",
        params={"code": "code", "state": state},
    )

    assert response.status_code == 200
    assert "tester@example.com" in response.text
    assert main.STATE_COOKIE_NAME in response.headers["set-cookie"]
