import json
from datetime import date, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge, ChallengeTemplate
from app.models.challenge_instance import ChallengeInstance, InstanceStatus
from app.models.daily_task_instance import DailyTaskInstance
from app.schemas.challenge import ChallengeCreate, ChallengeInstanceUpdate, StartChallengeRequest
from app.services.daily_task_service import ensure_daily_tasks
from app.services.pause_utils import _parse_pause_periods, get_paused_dates


async def list_templates(db: AsyncSession) -> list[ChallengeTemplate]:
    result = await db.execute(select(ChallengeTemplate))
    return list(result.scalars().all())


async def get_template_by_slug(db: AsyncSession, slug: str) -> ChallengeTemplate | None:
    result = await db.execute(select(ChallengeTemplate).where(ChallengeTemplate.slug == slug))
    return result.scalar_one_or_none()


async def create_challenge(db: AsyncSession, user_id: int, data: ChallengeCreate) -> Challenge:
    challenge = Challenge(
        title=data.title,
        description=data.description,
        type=data.type,
        default_duration_days=data.default_duration_days,
        tasks_per_day=data.tasks_per_day,
        task_times=json.dumps(data.task_times) if data.task_times else None,
        source_template_id=data.source_template_id,
    )
    db.add(challenge)
    await db.flush()
    return challenge


async def get_user_challenges(db: AsyncSession, user_id: int) -> list[ChallengeInstance]:
    result = await db.execute(
        select(ChallengeInstance)
        .where(ChallengeInstance.user_id == user_id)
        .options(selectinload(ChallengeInstance.challenge))
        .order_by(ChallengeInstance.created_at.desc())
    )
    return list(result.scalars().all())


async def start_challenge(db: AsyncSession, user_id: int, data: StartChallengeRequest) -> ChallengeInstance:
    result = await db.execute(select(Challenge).where(Challenge.id == data.challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise ValueError("Challenge not found")

    end_date = data.start_date + timedelta(days=challenge.default_duration_days - 1)
    initial_status = InstanceStatus.completed if end_date < date.today() else InstanceStatus.active

    instance = ChallengeInstance(
        user_id=user_id,
        challenge_id=challenge.id,
        start_date=data.start_date,
        end_date=end_date,
        status=initial_status,
    )
    db.add(instance)
    await db.flush()

    # Generate tasks for the entire challenge period (past + future)
    d = data.start_date
    while d <= end_date:
        await ensure_daily_tasks(db, user_id, d)
        d += timedelta(days=1)

    await db.refresh(instance, ["challenge"])
    return instance


async def get_instance(db: AsyncSession, instance_id: int, user_id: int) -> ChallengeInstance | None:
    result = await db.execute(
        select(ChallengeInstance)
        .where(ChallengeInstance.id == instance_id, ChallengeInstance.user_id == user_id)
        .options(selectinload(ChallengeInstance.challenge))
    )
    return result.scalar_one_or_none()


async def update_instance(
    db: AsyncSession, instance_id: int, user_id: int, data: ChallengeInstanceUpdate
) -> ChallengeInstance:
    instance = await get_instance(db, instance_id, user_id)
    if not instance:
        raise ValueError("Instance not found")

    challenge = instance.challenge
    period_changed = False

    if data.title is not None:
        challenge.title = data.title
    if data.description is not None:
        challenge.description = data.description
    if data.type is not None:
        challenge.type = data.type
    if data.start_date is not None and data.start_date != instance.start_date:
        instance.start_date = data.start_date
        period_changed = True
    if data.end_date is not None and data.end_date != instance.end_date:
        instance.end_date = data.end_date
        period_changed = True
    if data.task_times is not None:
        challenge.task_times = json.dumps(data.task_times)
        period_changed = True
    if data.tasks_per_day is not None and data.tasks_per_day != challenge.tasks_per_day:
        challenge.tasks_per_day = data.tasks_per_day
        period_changed = True

    await db.flush()

    # Regenerate all tasks if period, schedule, or task count changed
    if period_changed:
        await db.execute(
            delete(DailyTaskInstance).where(
                DailyTaskInstance.challenge_instance_id == instance_id
            )
        )
        await db.flush()
        d = instance.start_date
        while d <= instance.end_date:
            await ensure_daily_tasks(db, user_id, d)
            d += timedelta(days=1)

    # Auto-complete if end_date moved to the past (works for both active and paused)
    if instance.status in (InstanceStatus.active, InstanceStatus.paused) and instance.end_date < date.today():
        if instance.status == InstanceStatus.paused:
            # Close the open pause period before completing
            periods = _parse_pause_periods(instance.pause_periods)
            yesterday = date.today() - timedelta(days=1)
            for p in periods:
                if p.get("end") is None:
                    if yesterday >= date.fromisoformat(p["start"]):
                        p["end"] = str(yesterday)
                    else:
                        periods.remove(p)
                    break
            instance.pause_periods = json.dumps(periods)
        instance.status = InstanceStatus.completed
        await db.flush()

    return instance


async def pause_instance(db: AsyncSession, instance_id: int, user_id: int) -> ChallengeInstance:
    instance = await get_instance(db, instance_id, user_id)
    if not instance:
        raise ValueError("Instance not found")
    if instance.status != InstanceStatus.active:
        raise ValueError("Only active challenges can be paused")
    instance.status = InstanceStatus.paused
    periods = _parse_pause_periods(instance.pause_periods)
    periods.append({"start": str(date.today()), "end": None})
    instance.pause_periods = json.dumps(periods)
    await db.flush()
    return instance


async def resume_instance(db: AsyncSession, instance_id: int, user_id: int) -> ChallengeInstance:
    instance = await get_instance(db, instance_id, user_id)
    if not instance:
        raise ValueError("Instance not found")
    if instance.status != InstanceStatus.paused:
        raise ValueError("Only paused challenges can be resumed")
    periods = _parse_pause_periods(instance.pause_periods)
    today = date.today()
    yesterday = today - timedelta(days=1)
    for p in periods:
        if p.get("end") is None:
            if yesterday >= date.fromisoformat(p["start"]):
                p["end"] = str(yesterday)
            else:
                periods.remove(p)  # paused and resumed same day
            break
    instance.pause_periods = json.dumps(periods)
    # Auto-complete if end_date already passed
    if instance.end_date < today:
        instance.status = InstanceStatus.completed
    else:
        instance.status = InstanceStatus.active
    await db.flush()
    return instance


async def delete_instance(db: AsyncSession, instance_id: int, user_id: int) -> None:
    instance = await get_instance(db, instance_id, user_id)
    if not instance:
        raise ValueError("Instance not found")
    await db.execute(delete(DailyTaskInstance).where(DailyTaskInstance.challenge_instance_id == instance_id))
    await db.delete(instance)
    await db.flush()


async def complete_expired_challenges(db: AsyncSession) -> int:
    """Mark active challenges as completed if end_date < today. Returns count of completed."""
    from datetime import date as date_type
    today = date_type.today()
    result = await db.execute(
        select(ChallengeInstance).where(
            ChallengeInstance.status == InstanceStatus.active,
            ChallengeInstance.end_date < today,
        )
    )
    instances = list(result.scalars().all())
    for instance in instances:
        instance.status = InstanceStatus.completed
    await db.flush()
    return len(instances)
