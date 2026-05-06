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
    sequence_number: int | None = None  # position among sibling tasks (1-based)
    total_count: int | None = None      # total tasks for this challenge today

    model_config = {"from_attributes": True}


class DailySummary(BaseModel):
    date: date
    total: int
    completed: int
    skipped: int
    pending: int
    tasks: list[DailyTaskOut]
