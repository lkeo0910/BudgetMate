from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Project Settings
    PROJECT_NAME: str = "BudgetMate"
    
    # Database and Redis
    DATABASE_URL: str
    REDIS_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email SMTP
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASS: str
    EMAILS_FROM_EMAIL: str
    EMAILS_FROM_NAME: str = "BudgetMate"

    # OCR
    OCR_SPACE_API_KEY: str | None = None

    # AI Agent (Google Gemini)
    GOOGLE_API_KEY: str | None = None

    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str

    # LangSmith Tracing
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "BudgetMate"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
