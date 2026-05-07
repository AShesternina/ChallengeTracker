import enum
from sqlalchemy import Boolean, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChallengeType(str, enum.Enum):
    single = "single"      # one task per day at specific time
    multi = "multi"        # multiple tasks per day
    all_day = "all_day"    # open task, can be done anytime


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[ChallengeType] = mapped_column(Enum(ChallengeType), default=ChallengeType.single)
    default_duration_days: Mapped[int] = mapped_column(Integer, default=30)
    tasks_per_day: Mapped[int] = mapped_column(Integer, default=1)
    task_times: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of "HH:MM"
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    source_template_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    instances: Mapped[list["ChallengeInstance"]] = relationship(back_populates="challenge")


class ChallengeTemplate(Base):
    """Seed templates shown to user during onboarding."""
    __tablename__ = "challenge_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[ChallengeType] = mapped_column(Enum(ChallengeType), default=ChallengeType.single)
    default_duration_days: Mapped[int] = mapped_column(Integer, default=30)
    tasks_per_day: Mapped[int] = mapped_column(Integer, default=1)
    task_times: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
