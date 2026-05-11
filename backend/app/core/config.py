from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if self.APP_ENV == "production" and self.SECRET_KEY == "insecure-dev-secret":
            raise ValueError("SECRET_KEY must be changed from the default value in production")
        return self

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def async_database_url(self) -> str:
        # Render gives postgres://, SQLAlchemy asyncpg needs postgresql+asyncpg://
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    SECRET_KEY: str = "insecure-dev-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_MAILTO: str = "mailto:admin@example.com"

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""
    TELEGRAM_PROXY_URL: str = ""    # e.g. https://tg-proxy.username.workers.dev
    TELEGRAM_PROXY_SECRET: str = "" # must match PROXY_SECRET in Cloudflare Worker env

    RESEND_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@example.com"
    EMAIL_FROM_NAME: str = "ChallengeTracker"

    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def is_dev(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
