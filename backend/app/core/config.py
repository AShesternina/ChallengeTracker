from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "insecure-dev-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_MAILTO: str = "mailto:admin@example.com"

    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@example.com"
    EMAIL_FROM_NAME: str = "ChallengeTracker"

    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def is_dev(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
