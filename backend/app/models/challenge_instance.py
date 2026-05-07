import enum
from datetime import date, datetime, timezone
from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InstanceStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"


class ChallengeInstance(Base):
    __tablename__ = "challenge_instances"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    status: Mapped[InstanceStatus] = mapped_column(
        Enum(InstanceStatus), default=InstanceStatus.active
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    pause_periods: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="challenge_instances")
    challenge: Mapped["Challenge"] = relationship(back_populates="instances")
    daily_tasks: Mapped[list["DailyTaskInstance"]] = relationship(back_populates="challenge_instance")
