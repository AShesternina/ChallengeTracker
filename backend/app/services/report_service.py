from datetime import date
from calendar import monthrange

from sqlalchemy import and_, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.daily_task_instance import DailyTaskInstance, TaskStatus
from app.models.challenge_instance import ChallengeInstance
from app.schemas.reports import ChallengeReport, DayStats, MonthlyReport, StreakReport


async def streak_report(db: AsyncSession, user_id: int) -> StreakReport:
    """Global streak: consecutive days where user completed at least one task."""
    result = await db.execute(
        select(DailyTaskInstance.date, DailyTaskInstance.status)
        .where(DailyTaskInstance.user_id == user_id)
        .order_by(DailyTaskInstance.date)
    )
    rows = result.all()

    # aggregate: date → has_any_completed
    by_day: dict[date, bool] = {}
    for r in rows:
        if r.status == TaskStatus.completed:
            by_day[r.date] = True
        elif r.date not in by_day:
            by_day[r.date] = False

    sorted_days = sorted(by_day.keys())

    # longest streak
    longest_streak = 0
    streak = 0
    for d in sorted_days:
        if by_day[d]:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 0

    # current streak: walk back from today (skip today if no tasks yet)
    today = date.today()
    current_streak = 0
    start = today if today in by_day else date.fromordinal(today.toordinal() - 1)
    d = start
    while d in by_day and by_day[d]:
        current_streak += 1
        d = date.fromordinal(d.toordinal() - 1)

    return StreakReport(current_streak=current_streak, longest_streak=longest_streak)


async def daily_report(db: AsyncSession, user_id: int, target_date: date) -> DayStats:
    result = await db.execute(
        select(DailyTaskInstance).where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date == target_date,
            )
        )
    )
    tasks = list(result.scalars().all())
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    return DayStats(
        date=target_date,
        total=total,
        completed=completed,
        completion_rate=round(completed / total, 2) if total else 0.0,
    )


async def monthly_report(db: AsyncSession, user_id: int, year: int, month: int) -> MonthlyReport:
    _, days_in_month = monthrange(year, month)
    start = date(year, month, 1)
    end = date(year, month, days_in_month)

    result = await db.execute(
        select(DailyTaskInstance).where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date >= start,
                DailyTaskInstance.date <= end,
            )
        )
    )
    tasks = list(result.scalars().all())

    by_day: dict[date, list[DailyTaskInstance]] = {}
    for t in tasks:
        by_day.setdefault(t.date, []).append(t)

    days = []
    for d in (date(year, month, i) for i in range(1, days_in_month + 1)):
        day_tasks = by_day.get(d, [])
        total = len(day_tasks)
        completed = sum(1 for t in day_tasks if t.status == TaskStatus.completed)
        days.append(
            DayStats(
                date=d,
                total=total,
                completed=completed,
                completion_rate=round(completed / total, 2) if total else 0.0,
            )
        )

    total_tasks = sum(d.total for d in days)
    total_completed = sum(d.completed for d in days)
    return MonthlyReport(
        year=year,
        month=month,
        days=days,
        total_tasks=total_tasks,
        total_completed=total_completed,
        completion_rate=round(total_completed / total_tasks, 2) if total_tasks else 0.0,
    )


async def challenge_report(
    db: AsyncSession, user_id: int, instance_id: int
) -> ChallengeReport:
    result = await db.execute(
        select(ChallengeInstance)
        .where(ChallengeInstance.id == instance_id, ChallengeInstance.user_id == user_id)
        .options(selectinload(ChallengeInstance.challenge))
    )
    instance = result.scalar_one_or_none()
    if not instance:
        raise ValueError("Instance not found")

    task_result = await db.execute(
        select(DailyTaskInstance).where(
            DailyTaskInstance.challenge_instance_id == instance_id
        ).order_by(DailyTaskInstance.date)
    )
    tasks = list(task_result.scalars().all())

    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    skipped = sum(1 for t in tasks if t.status == TaskStatus.skipped)

    # streak calculation
    current_streak, longest_streak, streak = 0, 0, 0
    by_day: dict[date, list] = {}
    for t in tasks:
        by_day.setdefault(t.date, []).append(t)

    for d in sorted(by_day.keys()):
        day_tasks = by_day[d]
        day_completed = all(t.status == TaskStatus.completed for t in day_tasks)
        if day_completed:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 0

    current_streak = streak

    return ChallengeReport(
        challenge_instance_id=instance_id,
        challenge_title=instance.challenge.title,
        start_date=instance.start_date,
        end_date=instance.end_date,
        total_tasks=total,
        completed_tasks=completed,
        skipped_tasks=skipped,
        completion_rate=round(completed / total, 2) if total else 0.0,
        current_streak=current_streak,
        longest_streak=longest_streak,
    )
