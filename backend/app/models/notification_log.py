import enum
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NotificationType(str, enum.Enum):
    morning_summary = "morning_summary"
    task_reminder = "task_reminder"
    daily_report = "daily_report"
    weekly_review = "weekly_review"


class NotificationChannel(str, enum.Enum):
    push = "push"
    email = "email"
    telegram = "telegram"


class NotificationStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"
    pending = "pending"


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    channel: Mapped[NotificationChannel] = mapped_column(Enum(NotificationChannel))
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus), default=NotificationStatus.pending
    )
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="notification_logs")
