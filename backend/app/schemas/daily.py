from datetime import date, datetime, time
from pydantic import BaseModel
from app.models.daily_task_instance import TaskStatus, TaskType


class DailyTaskOut(BaseModel):
    id: int
    challenge_instance_id: int
    challenge_title: str
    date: date
    scheduled_time: time | None
    type: TaskType
    status: TaskStatus
    completed_at: datetime | None
    sequence_number: int | None = None
    total_count: int | None = None
    challenge_status: str = "active"  # status of the parent ChallengeInstance

    model_config = {"from_attributes": True}


class DailySummary(BaseModel):
    date: date
    total: int
    completed: int
    skipped: int
    pending: int
    tasks: list[DailyTaskOut]
