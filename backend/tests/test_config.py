import os

from backend.app.config import load_env_file


def test_load_env_file_keeps_existing_environment(monkeypatch, tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("APP_BASE_URL=http://from-file\nEXISTING=file-value\n", encoding="utf-8")
    monkeypatch.delenv("APP_BASE_URL", raising=False)
    monkeypatch.setenv("EXISTING", "env-value")

    load_env_file(env_file)

    assert os.environ["APP_BASE_URL"] == "http://from-file"
    assert os.environ["EXISTING"] == "env-value"
