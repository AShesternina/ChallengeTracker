import json
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge, ChallengeTemplate
from app.models.challenge_instance import ChallengeInstance, InstanceStatus
from app.schemas.challenge import ChallengeCreate, ChallengeInstanceUpdate, StartChallengeRequest


async def list_templates(db: AsyncSession) -> list[ChallengeTemplate]:
    result = await db.execute(select(ChallengeTemplate))
    return list(result.scalars().all())


async def create_challenge(db: AsyncSession, user_id: int, data: ChallengeCreate) -> Challenge:
    challenge = Challenge(
        title=data.title,
        description=data.description,
        type=data.type,
        default_duration_days=data.default_duration_days,
        tasks_per_day=data.tasks_per_day,
        task_times=json.dumps(data.task_times) if data.task_times else None,
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

    instance = ChallengeInstance(
        user_id=user_id,
        challenge_id=challenge.id,
        start_date=data.start_date,
        end_date=end_date,
        status=InstanceStatus.active,
    )
    db.add(instance)
    await db.flush()
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
    if data.title is not None:
        challenge.title = data.title
    if data.description is not None:
        challenge.description = data.description
    if data.end_date is not None:
        instance.end_date = data.end_date
    if data.task_times is not None:
        challenge.task_times = json.dumps(data.task_times)
    if data.tasks_per_day is not None:
        challenge.tasks_per_day = data.tasks_per_day

    await db.flush()
    return instance


async def cancel_instance(db: AsyncSession, instance_id: int, user_id: int) -> ChallengeInstance:
    instance = await get_instance(db, instance_id, user_id)
    if not instance:
        raise ValueError("Instance not found")
    instance.status = InstanceStatus.cancelled
    await db.flush()
    return instance


async def delete_instance(db: AsyncSession, instance_id: int, user_id: int) -> None:
    instance = await get_instance(db, instance_id, user_id)
    if not instance:
        raise ValueError("Instance not found")
    if instance.status != InstanceStatus.cancelled:
        raise ValueError("Only cancelled challenges can be deleted")
    await db.delete(instance)
    await db.flush()
