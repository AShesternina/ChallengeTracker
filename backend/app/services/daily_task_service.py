"""Daily Task Engine.

Day → tasks ← challenges (not: challenge → tasks).

For each active ChallengeInstance whose date range covers `target_date`,
we ensure the correct number of DailyTaskInstance rows exist for that day.
This is idempotent — safe to call multiple times.
"""

import json
from datetime import date, datetime, time, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import ChallengeType
from app.models.challenge_instance import ChallengeInstance, InstanceStatus
from app.models.daily_task_instance import DailyTaskInstance, TaskStatus, TaskType
from app.schemas.daily import DailySummary, DailyTaskOut


def _task_type_from_challenge(ct: ChallengeType) -> TaskType:
    mapping = {
        ChallengeType.single: TaskType.single,
        ChallengeType.multi: TaskType.multi,
        ChallengeType.all_day: TaskType.all_day,
    }
    return mapping[ct]


def _parse_times(task_times_json: str | None) -> list[time | None]:
    if not task_times_json:
        return [None]
    try:
        times = json.loads(task_times_json)
        result = []
        for t in times:
            h, m = map(int, t.split(":"))
            result.append(time(h, m))
        return result or [None]
    except (json.JSONDecodeError, ValueError, TypeError):
        return [None]


async def ensure_daily_tasks(db: AsyncSession, user_id: int, target_date: date) -> None:
    """Create missing DailyTaskInstance rows for all active challenges on target_date."""
    result = await db.execute(
        select(ChallengeInstance)
        .where(
            and_(
                ChallengeInstance.user_id == user_id,
                ChallengeInstance.status.in_([InstanceStatus.active, InstanceStatus.paused]),
                ChallengeInstance.start_date <= target_date,
                ChallengeInstance.end_date >= target_date,
            )
        )
        .options(selectinload(ChallengeInstance.challenge))
    )
    instances = list(result.scalars().all())

    for instance in instances:
        challenge = instance.challenge
        times = _parse_times(challenge.task_times)
        # Pad or trim to tasks_per_day
        while len(times) < challenge.tasks_per_day:
            times.append(None)
        times = times[: challenge.tasks_per_day]

        existing = await db.execute(
            select(DailyTaskInstance).where(
                and_(
                    DailyTaskInstance.challenge_instance_id == instance.id,
                    DailyTaskInstance.date == target_date,
                )
            )
        )
        existing_count = len(list(existing.scalars().all()))
        needed = challenge.tasks_per_day - existing_count

        for i in range(needed):
            scheduled = times[existing_count + i] if (existing_count + i) < len(times) else None
            db.add(
                DailyTaskInstance(
                    user_id=user_id,
                    challenge_instance_id=instance.id,
                    date=target_date,
                    scheduled_time=scheduled,
                    type=_task_type_from_challenge(challenge.type),
                    status=TaskStatus.pending,
                )
            )

    await db.flush()


async def get_daily_tasks(db: AsyncSession, user_id: int, target_date: date) -> DailySummary:
    await ensure_daily_tasks(db, user_id, target_date)

    result = await db.execute(
        select(DailyTaskInstance)
        .where(
            and_(
                DailyTaskInstance.user_id == user_id,
                DailyTaskInstance.date == target_date,
            )
        )
        .options(selectinload(DailyTaskInstance.challenge_instance).selectinload(ChallengeInstance.challenge))
        .order_by(DailyTaskInstance.scheduled_time.nulls_last(), DailyTaskInstance.id)
    )
    tasks = list(result.scalars().all())

    # compute sequence_number and total_count per challenge
    counts: dict[int, int] = {}
    for t in tasks:
        counts[t.challenge_instance_id] = counts.get(t.challenge_instance_id, 0) + 1

    seq: dict[int, int] = {}
    task_outs = []
    for t in tasks:
        seq[t.challenge_instance_id] = seq.get(t.challenge_instance_id, 0) + 1
        total = counts[t.challenge_instance_id]
        task_outs.append(DailyTaskOut(
            id=t.id,
            challenge_instance_id=t.challenge_instance_id,
            challenge_title=t.challenge_instance.challenge.title,
            date=t.date,
            scheduled_time=t.scheduled_time,
            type=t.type,
            status=t.status,
            completed_at=t.completed_at,
            sequence_number=seq[t.challenge_instance_id] if total > 1 else None,
            total_count=total if total > 1 else None,
            challenge_status=t.challenge_instance.status.value,
        ))

    completed = sum(1 for t in tasks if t.status == TaskStatus.completed)
    skipped = sum(1 for t in tasks if t.status == TaskStatus.skipped)

    return DailySummary(
        date=target_date,
        total=len(tasks),
        completed=completed,
        skipped=skipped,
        pending=len(tasks) - completed - skipped,
        tasks=task_outs,
    )


async def complete_task(db: AsyncSession, task_id: int, user_id: int) -> DailyTaskOut:
    return await _update_task_status(db, task_id, user_id, TaskStatus.completed)


async def skip_task(db: AsyncSession, task_id: int, user_id: int) -> DailyTaskOut:
    return await _update_task_status(db, task_id, user_id, TaskStatus.skipped)


async def reset_task(db: AsyncSession, task_id: int, user_id: int) -> DailyTaskOut:
    result = await db.execute(
        select(DailyTaskInstance)
        .where(DailyTaskInstance.id == task_id, DailyTaskInstance.user_id == user_id)
        .options(selectinload(DailyTaskInstance.challenge_instance).selectinload(ChallengeInstance.challenge))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")

    task.status = TaskStatus.pending
    task.completed_at = None
    await db.flush()

    return DailyTaskOut(
        id=task.id,
        challenge_instance_id=task.challenge_instance_id,
        challenge_title=task.challenge_instance.challenge.title,
        date=task.date,
        scheduled_time=task.scheduled_time,
        type=task.type,
        status=task.status,
        completed_at=task.completed_at,
    )


async def _update_task_status(
    db: AsyncSession, task_id: int, user_id: int, new_status: TaskStatus
) -> DailyTaskOut:
    result = await db.execute(
        select(DailyTaskInstance)
        .where(DailyTaskInstance.id == task_id, DailyTaskInstance.user_id == user_id)
        .options(selectinload(DailyTaskInstance.challenge_instance).selectinload(ChallengeInstance.challenge))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")

    task.status = new_status
    if new_status == TaskStatus.completed:
        task.completed_at = datetime.now(timezone.utc)

    await db.flush()

    return DailyTaskOut(
        id=task.id,
        challenge_instance_id=task.challenge_instance_id,
        challenge_title=task.challenge_instance.challenge.title,
        date=task.date,
        scheduled_time=task.scheduled_time,
        type=task.type,
        status=task.status,
        completed_at=task.completed_at,
    )
