from datetime import date, datetime
from pydantic import BaseModel, field_validator
from app.models.challenge import ChallengeType
from app.models.challenge_instance import InstanceStatus


class ChallengeCreate(BaseModel):
    title: str
    description: str | None = None
    type: ChallengeType = ChallengeType.single
    default_duration_days: int = 30
    tasks_per_day: int = 1
    task_times: list[str] | None = None  # ["HH:MM", ...]
    source_template_id: int | None = None

    @field_validator("default_duration_days")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if not 1 <= v <= 365:
            raise ValueError("Duration must be between 1 and 365 days")
        return v

    @field_validator("tasks_per_day")
    @classmethod
    def validate_tasks_per_day(cls, v: int) -> int:
        if not 1 <= v <= 10:
            raise ValueError("tasks_per_day must be between 1 and 10")
        return v

    @field_validator("task_times", mode="before")
    @classmethod
    def validate_times(cls, v):
        if v is None:
            return v
        for t in v:
            parts = str(t).split(":")
            if len(parts) != 2:
                raise ValueError(f"Invalid time format: {t}")
        return v


class ChallengeOut(BaseModel):
    id: int
    title: str
    description: str | None
    type: ChallengeType
    default_duration_days: int
    tasks_per_day: int
    task_times: list[str] | None
    source_template_id: int | None = None

    model_config = {"from_attributes": True}

    @field_validator("task_times", mode="before")
    @classmethod
    def parse_task_times(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


class ChallengeTemplateOut(BaseModel):
    id: int
    title: str
    description: str | None
    type: ChallengeType
    default_duration_days: int
    tasks_per_day: int
    task_times: list[str] | None
    icon: str | None
    slug: str | None = None

    model_config = {"from_attributes": True}

    @field_validator("task_times", mode="before")
    @classmethod
    def parse_task_times(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


class PublicTemplateOut(BaseModel):
    slug: str
    title: str
    description: str | None
    type: ChallengeType
    default_duration_days: int
    tasks_per_day: int
    task_times: list[str] | None
    icon: str | None

    model_config = {"from_attributes": True}

    @field_validator("task_times", mode="before")
    @classmethod
    def parse_task_times(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


class StartChallengeRequest(BaseModel):
    challenge_id: int
    start_date: date


class ChallengeInstanceUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    tasks_per_day: int | None = None
    task_times: list[str] | None = None
    type: ChallengeType | None = None


class ChallengeInstanceOut(BaseModel):
    id: int
    challenge_id: int
    challenge: ChallengeOut
    start_date: date
    end_date: date
    status: InstanceStatus
    created_at: datetime

    model_config = {"from_attributes": True}
