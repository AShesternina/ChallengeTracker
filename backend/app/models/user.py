from datetime import datetime, timezone
from sqlalchemy import BigInteger, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    language: Mapped[str] = mapped_column(String(5), default="en")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    notification_morning_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    notification_evening_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    notify_task_reminders: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_email_daily: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    notify_email_weekly: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    streak_protection: Mapped[bool] = mapped_column(Boolean, default=True)
    theme: Mapped[str] = mapped_column(String(10), default="system")
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    telegram_linking_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email_verification_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    otp_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    challenge_instances: Mapped[list["ChallengeInstance"]] = relationship(back_populates="user")
    devices: Mapped[list["UserDevice"]] = relationship(back_populates="user")
    notification_logs: Mapped[list["NotificationLog"]] = relationship(back_populates="user")
