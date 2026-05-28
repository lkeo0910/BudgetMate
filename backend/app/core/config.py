from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    database_url: str
    mongodb_uri: str
    redis_url: str
    google_api_key: str | None = None
    ocr_space_api_key: str | None = None
    jwt_secret_key: str
    cors_origin: str = "*"
    database_fallback_to_sqlite: bool = True
    sqlite_database_path: str = "budgetmate.db"
    postgres_connect_timeout: float = 8
    mongodb_required: bool = False
    mongodb_server_selection_timeout_ms: int = 8000

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
