from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    database_url: str | None = None
    mongodb_uri: str | None = None
    redis_url: str | None = None
    google_api_key: str | None = None
    ocr_space_api_key: str | None = None
    jwt_secret_key: str = "local_dev_change_me"
    jwt_access_token_expire_minutes: int = 60 * 24 * 30
    cors_origin: str = "http://127.0.0.1:8081,http://localhost:8081"
    database_fallback_to_sqlite: bool = True
    sqlite_database_path: str = "budgetmate.db"
    postgres_connect_timeout: float = 8
    mongodb_required: bool = False
    mongodb_server_selection_timeout_ms: int = 8000
    upload_dir: str = "uploads"
    max_profile_photo_bytes: int = 5 * 1024 * 1024
    rate_limit_enabled: bool = True
    rate_limit_sensitive_requests: int = 20
    rate_limit_sensitive_window_seconds: int = 60
    push_provider: str = "future"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
