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


class ChallengeInstanceOut(BaseModel):
    id: int
    challenge_id: int
    challenge: ChallengeOut
    start_date: date
    end_date: date
    status: InstanceStatus
    created_at: datetime

    model_config = {"from_attributes": True}
