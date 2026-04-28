import enum
from datetime import date, datetime, time, timezone
from sqlalchemy import Date, DateTime, Enum, ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    skipped = "skipped"


class TaskType(str, enum.Enum):
    single = "single"
    multi = "multi"
    all_day = "all_day"


class DailyTaskInstance(Base):
    __tablename__ = "daily_task_instances"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    challenge_instance_id: Mapped[int] = mapped_column(ForeignKey("challenge_instances.id"))
    date: Mapped[date] = mapped_column(Date, index=True)
    scheduled_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    type: Mapped[TaskType] = mapped_column(Enum(TaskType), default=TaskType.single)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.pending)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    challenge_instance: Mapped["ChallengeInstance"] = relationship(back_populates="daily_tasks")
