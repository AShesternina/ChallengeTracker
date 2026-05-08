from datetime import date, timedelta
from calendar import monthrange

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.daily_task_instance import DailyTaskInstance, TaskStatus
from app.models.challenge_instance import ChallengeInstance
from app.schemas.reports import ChallengeReport, DayStats, MomentumReport, MonthlyReport, StreakReport, WeekdayPatternsReport
from app.services.pause_utils import get_paused_dates, is_paused_on


async def momentum_report(db: AsyncSession, user_id: int) -> MomentumReport:
    """Weighted completion rate over last 14 days. Today = weight 14, 13 days ago = weight 1."""
    from datetime import timedelta
    today = date.today()
    start = today - timedelta(days=13)

    result = await db.execute(
        select(DailyTaskInstance)
        .where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date >= start,
                DailyTaskInstance.date <= today,
            )
        )
        .options(selectinload(DailyTaskInstance.challenge_instance))
    )
    tasks = list(result.scalars().all())

    # Group by day, exclude paused
    by_day: dict[date, list] = {}
    for t in tasks:
        if not is_paused_on(t.challenge_instance.pause_periods, t.date):
            by_day.setdefault(t.date, []).append(t)

    def _avg(day_list: list[date]) -> float | None:
        weights, weighted = 0.0, 0.0
        for d in day_list:
            if d not in by_day:
                continue
            days_ago = (today - d).days
            w = 14 - days_ago  # today=14, 13 days ago=1
            day_tasks = by_day[d]
            total = len(day_tasks)
            if total == 0:
                continue
            rate = sum(1 for t in day_tasks if t.status == TaskStatus.completed) / total
            weighted += w * rate
            weights += w
        return weighted / weights if weights else None

    last_7 = [today - timedelta(days=i) for i in range(7)]
    prev_7 = [today - timedelta(days=i) for i in range(7, 14)]

    last_avg = _avg(last_7)
    prev_avg = _avg(prev_7)

    # Overall score using all 14 days
    all_14 = [today - timedelta(days=i) for i in range(14)]
    score_val = _avg(all_14)
    score = round((score_val or 0) * 100)
    days_tracked = sum(1 for d in all_14 if d in by_day and by_day[d])

    # Trend
    if last_avg is None or prev_avg is None:
        trend, delta = "stable", 0
    else:
        delta = round((last_avg - prev_avg) * 100)
        if delta >= 5:
            trend = "up"
        elif delta <= -5:
            trend = "down"
        else:
            trend, delta = "stable", delta

    return MomentumReport(score=score, days_tracked=days_tracked, trend=trend, trend_delta=delta)


async def streak_report(db: AsyncSession, user_id: int) -> StreakReport:
    """Global streak: consecutive days where user completed at least one task (paused days skipped)."""
    result = await db.execute(
        select(DailyTaskInstance)
        .where(DailyTaskInstance.user_id == user_id)
        .options(selectinload(DailyTaskInstance.challenge_instance))
        .order_by(DailyTaskInstance.date)
    )
    rows = list(result.scalars().all())

    by_day: dict[date, bool] = {}
    for t in rows:
        if is_paused_on(t.challenge_instance.pause_periods, t.date):
            continue
        if t.status == TaskStatus.completed:
            by_day[t.date] = True
        elif t.date not in by_day:
            by_day[t.date] = False

    sorted_days = sorted(by_day.keys())

    today = date.today()
    longest_streak = 0
    streak = 0
    for d in sorted_days:
        if d > today:
            break  # future pending days must not affect longest streak
        if by_day[d]:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 0

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
        select(DailyTaskInstance)
        .where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date == target_date,
            )
        )
        .options(selectinload(DailyTaskInstance.challenge_instance))
    )
    tasks = list(result.scalars().all())
    active = [t for t in tasks if not is_paused_on(t.challenge_instance.pause_periods, target_date)]
    total = len(active)
    completed = sum(1 for t in active if t.status == TaskStatus.completed)
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
        select(DailyTaskInstance)
        .where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date >= start,
                DailyTaskInstance.date <= end,
            )
        )
        .options(selectinload(DailyTaskInstance.challenge_instance))
    )
    tasks = list(result.scalars().all())

    by_day: dict[date, list[DailyTaskInstance]] = {}
    for t in tasks:
        if not is_paused_on(t.challenge_instance.pause_periods, t.date):
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
        select(DailyTaskInstance)
        .where(DailyTaskInstance.challenge_instance_id == instance_id)
        .order_by(DailyTaskInstance.date)
    )
    tasks = list(task_result.scalars().all())

    paused_dates = get_paused_dates(instance.pause_periods)
    active_tasks = [t for t in tasks if t.date not in paused_dates]

    total = len(active_tasks)
    completed = sum(1 for t in active_tasks if t.status == TaskStatus.completed)
    skipped = sum(1 for t in active_tasks if t.status == TaskStatus.skipped)

    # streak — группируем по дням, паузные дни пропускаем (не считаем и не ломают)
    by_day: dict[date, list] = {}
    for t in tasks:
        by_day.setdefault(t.date, []).append(t)

    today = date.today()
    current_streak, longest_streak, streak = 0, 0, 0
    for d in sorted(by_day.keys()):
        if d > today:
            break  # future days don't affect streak
        if d in paused_dates:
            continue
        day_tasks = by_day[d]
        if all(t.status == TaskStatus.completed for t in day_tasks):
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 0

    current_streak = streak

    # ── Recovery analytics ────────────────────────────────────────────────────
    breaks_count = 0
    comeback_durations: list[int] = []
    state = "none"  # "none" | "good" | "break"
    break_start: date | None = None

    for d in sorted(by_day.keys()):
        if d > today or d in paused_dates:
            continue
        is_good = all(t.status == TaskStatus.completed for t in by_day[d])
        if state == "none":
            state = "good" if is_good else "none"
        elif state == "good":
            if not is_good:
                state = "break"
                breaks_count += 1
                break_start = d
        elif state == "break":
            if is_good:
                comeback_durations.append((d - break_start).days)  # type: ignore[operator]
                state = "good"

    comebacks_count = len(comeback_durations)
    avg_comeback_days = round(sum(comeback_durations) / comebacks_count, 1) if comebacks_count else None
    if breaks_count == 0:
        resilience_score = 100 if any(
            all(t.status == TaskStatus.completed for t in by_day[d])
            for d in by_day if d <= today and d not in paused_dates
        ) else None
    else:
        resilience_score = round(comebacks_count / breaks_count * 100)

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
        breaks_count=breaks_count,
        comebacks_count=comebacks_count,
        avg_comeback_days=avg_comeback_days,
        resilience_score=resilience_score,
    )


async def weekly_review_data(db: AsyncSession, user_id: int, today: date) -> dict | None:
    """Weekly stats for Sunday evening notification.

    Returns None if user had no tasks this week (nothing useful to report).
    """
    from app.models.challenge import Challenge

    two_weeks_ago = today - timedelta(days=13)
    this_week = [today - timedelta(days=i) for i in range(7)]
    prev_week = [today - timedelta(days=i) for i in range(7, 14)]

    rows = (await db.execute(
        select(DailyTaskInstance, Challenge.title.label("ctitle"), ChallengeInstance.pause_periods.label("pperiods"))
        .join(ChallengeInstance, DailyTaskInstance.challenge_instance_id == ChallengeInstance.id)
        .join(Challenge, ChallengeInstance.challenge_id == Challenge.id)
        .where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date >= two_weeks_ago,
                DailyTaskInstance.date <= today,
            )
        )
    )).all()

    # Per-day and per-challenge stats, excluding paused days
    day_stats: dict[date, dict] = {}
    challenge_stats: dict[str, dict] = {}

    for task, ctitle, pperiods in rows:
        if is_paused_on(pperiods, task.date):
            continue
        d = task.date
        if d not in day_stats:
            day_stats[d] = {"total": 0, "completed": 0}
        day_stats[d]["total"] += 1
        if task.status == TaskStatus.completed:
            day_stats[d]["completed"] += 1
        # Only count challenge stats for this week
        if d in this_week:
            if ctitle not in challenge_stats:
                challenge_stats[ctitle] = {"total": 0, "completed": 0}
            challenge_stats[ctitle]["total"] += 1
            if task.status == TaskStatus.completed:
                challenge_stats[ctitle]["completed"] += 1

    week_total = sum(day_stats.get(d, {}).get("total", 0) for d in this_week)
    week_completed = sum(day_stats.get(d, {}).get("completed", 0) for d in this_week)
    if week_total == 0:
        return None

    week_rate = round(week_completed / week_total * 100)

    prev_total = sum(day_stats.get(d, {}).get("total", 0) for d in prev_week)
    prev_completed = sum(day_stats.get(d, {}).get("completed", 0) for d in prev_week)
    prev_rate = round(prev_completed / prev_total * 100) if prev_total else 0

    delta = week_rate - prev_rate
    if delta >= 5:
        trend, trend_arrow = "up", "↑"
    elif delta <= -5:
        trend, trend_arrow = "down", "↓"
    else:
        trend, trend_arrow = "stable", "→"

    # Best challenge this week (highest completion rate, at least 1 task)
    best_challenge: str | None = None
    best_rate = -1.0
    for title, stats in challenge_stats.items():
        if stats["total"] > 0:
            r = stats["completed"] / stats["total"]
            if r > best_rate:
                best_rate = r
                best_challenge = title

    return {
        "week_completed": week_completed,
        "week_total": week_total,
        "week_rate": week_rate,
        "prev_week_rate": prev_rate,
        "trend": trend,
        "trend_arrow": trend_arrow,
        "trend_delta": abs(delta),
        "best_challenge": best_challenge,
    }


async def weekday_patterns(db: AsyncSession, user_id: int) -> WeekdayPatternsReport:
    """Completion rate by day of week (Mon=0 … Sun=6) across all history."""
    today = date.today()

    result = await db.execute(
        select(DailyTaskInstance)
        .where(DailyTaskInstance.user_id == user_id)
        .options(selectinload(DailyTaskInstance.challenge_instance))
    )
    tasks = list(result.scalars().all())

    totals = [0] * 7
    completed_counts = [0] * 7

    for t in tasks:
        if t.date > today:
            continue
        if is_paused_on(t.challenge_instance.pause_periods, t.date):
            continue
        wd = t.date.weekday()  # 0=Mon, 6=Sun
        totals[wd] += 1
        if t.status == TaskStatus.completed:
            completed_counts[wd] += 1

    rates = [
        round(completed_counts[i] / totals[i], 2) if totals[i] > 0 else 0.0
        for i in range(7)
    ]

    return WeekdayPatternsReport(totals=totals, completed=completed_counts, rates=rates)
