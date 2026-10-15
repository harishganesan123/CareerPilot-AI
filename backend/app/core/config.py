"""
Centralized application configuration.

All configuration is read from environment variables (or a local .env file
during development). Nothing sensitive is ever hard-coded here.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "CareerPilot AI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"  # development | production
    API_PREFIX: str = "/api"

    # --- Database ---
    # Example (local):  postgresql+psycopg://user:password@localhost:5432/careerpilot
    # Example (Neon):   postgresql+psycopg://user:password@ep-xxxx.neon.tech/careerpilot?sslmode=require
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/careerpilot"

    # --- Auth / JWT ---
    JWT_SECRET: str = "change-me-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # --- AI provider (configurable, never hard-coded) ---
    AI_API_KEY: str = ""
    AI_MODEL: str = "claude-sonnet-4-6"
    AI_PROVIDER: str = "anthropic"

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance so we parse the environment only once."""
    return Settings()


settings = get_settings()
