"""
Central configuration. All env vars go through here.
Never import os.environ directly anywhere else in the codebase.
"""

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── App ───────────────────────────────────────────────────
    NODE_ENV: str = "development"
    APP_NAME: str = "LandVerify"
    APP_VERSION: str = "0.1.0"
    API_DEBUG: bool = True

    # ── Server ────────────────────────────────────────────────
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "landverify.ng", "*.landverify.ng"]
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://landverify.ng"]

    # ── Security ──────────────────────────────────────────────
    API_SECRET_KEY: str
    API_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # ── Redis ─────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None

    # ── KYC ───────────────────────────────────────────────────
    SMILE_ID_PARTNER_ID: str
    SMILE_ID_API_KEY: str
    SMILE_ID_ENVIRONMENT: str = "sandbox"

    # ── Payments ──────────────────────────────────────────────
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_PUBLIC_KEY: str

    # ── Storage ───────────────────────────────────────────────
    STORAGE_BUCKET_DOCUMENTS: str = "landverify-documents"
    STORAGE_BUCKET_AVATARS: str = "landverify-avatars"

    # ── Email ─────────────────────────────────────────────────
    RESEND_API_KEY: str
    EMAIL_FROM: str = "noreply@landverify.ng"

    # ── Monitoring ────────────────────────────────────────────
    SENTRY_DSN: Optional[str] = None

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.NODE_ENV == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
