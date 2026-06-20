import pytest

from backend.app.security import StateError, create_oauth_state, verify_oauth_state


def test_oauth_state_round_trip() -> None:
    state, payload = create_oauth_state("secret", now=100)

    verified = verify_oauth_state(state, "secret", now=120)

    assert verified.nonce == payload.nonce
    assert verified.issued_at == 100


def test_oauth_state_rejects_tampering() -> None:
    state, _ = create_oauth_state("secret", now=100)
    tampered = f"{state}x"

    with pytest.raises(StateError):
        verify_oauth_state(tampered, "secret", now=120)


def test_oauth_state_rejects_expired_value() -> None:
    state, _ = create_oauth_state("secret", now=100)

    with pytest.raises(StateError):
        verify_oauth_state(state, "secret", max_age_seconds=60, now=200)
