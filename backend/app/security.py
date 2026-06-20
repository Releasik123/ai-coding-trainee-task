import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass


class StateError(ValueError):
    pass


@dataclass(frozen=True)
class OAuthState:
    nonce: str
    issued_at: int


def create_oauth_state(secret: str, now: int | None = None) -> tuple[str, OAuthState]:
    issued_at = int(now if now is not None else time.time())
    payload = OAuthState(nonce=secrets.token_urlsafe(24), issued_at=issued_at)
    encoded_payload = _urlsafe_b64encode(
        json.dumps(
            {"nonce": payload.nonce, "iat": payload.issued_at},
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8"),
    )
    signature = _sign(encoded_payload, secret)

    return f"{encoded_payload}.{signature}", payload


def verify_oauth_state(
    value: str,
    secret: str,
    max_age_seconds: int = 600,
    now: int | None = None,
) -> OAuthState:
    try:
        encoded_payload, signature = value.split(".", 1)
    except ValueError as exc:
        raise StateError("OAuth state has an invalid format.") from exc

    expected_signature = _sign(encoded_payload, secret)

    if not hmac.compare_digest(signature, expected_signature):
        raise StateError("OAuth state signature is invalid.")

    try:
        raw_payload = _urlsafe_b64decode(encoded_payload)
        payload = json.loads(raw_payload)
        nonce = str(payload["nonce"])
        issued_at = int(payload["iat"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise StateError("OAuth state payload is invalid.") from exc

    current_time = int(now if now is not None else time.time())

    if issued_at > current_time + 30:
        raise StateError("OAuth state was issued in the future.")

    if current_time - issued_at > max_age_seconds:
        raise StateError("OAuth state has expired.")

    return OAuthState(nonce=nonce, issued_at=issued_at)


def _sign(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest()
    return _urlsafe_b64encode(digest)


def _urlsafe_b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")

