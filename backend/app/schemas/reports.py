from datetime import date
from pydantic import BaseModel


class DayStats(BaseModel):
    date: date
    total: int
    completed: int
    completion_rate: float


class MonthlyReport(BaseModel):
    year: int
    month: int
    days: list[DayStats]
    total_tasks: int
    total_completed: int
    completion_rate: float


class ChallengeReport(BaseModel):
    challenge_instance_id: int
    challenge_title: str
    start_date: date
    end_date: date
    total_tasks: int
    completed_tasks: int
    skipped_tasks: int
    completion_rate: float
    current_streak: int
    longest_streak: int
