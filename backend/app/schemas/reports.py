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


class StreakReport(BaseModel):
    current_streak: int
    longest_streak: int
    grace_day_used: bool = False


class MomentumReport(BaseModel):
    score: int          # 0–100 weighted completion rate over last 14 days
    days_tracked: int   # days with tasks in last 14 days
    trend: str          # "up" | "down" | "stable"
    trend_delta: int    # percentage point change vs previous 7 days


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
    # Recovery analytics
    breaks_count: int
    comebacks_count: int
    avg_comeback_days: float | None   # None if no comebacks
    resilience_score: int | None      # None if no data (< 2 days tracked)


class WeekdayPatternsReport(BaseModel):
    # 7 items, index 0=Monday ... 6=Sunday
    totals: list[int]       # tasks seen per weekday
    completed: list[int]    # completed tasks per weekday
    rates: list[float]      # completion rate 0.0–1.0 per weekday
