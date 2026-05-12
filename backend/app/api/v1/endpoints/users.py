import re
import pytz
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, hash_password
from app.models.challenge import Challenge
from app.models.challenge_instance import ChallengeInstance
from app.models.daily_task_instance import DailyTaskInstance
from app.models.notification_log import NotificationLog
from app.models.user import User
from app.models.user_device import UserDevice
from app.schemas.user import UserOut, UserUpdateRequest, ChangePasswordRequest
from app.services.language_service import SUPPORTED_LANGUAGES

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if data.name is not None:
        user.name = data.name.strip() or None
    if data.timezone is not None:
        if data.timezone not in pytz.all_timezones:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timezone")
        user.timezone = data.timezone
    if data.language is not None:
        if data.language not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported language")
        user.language = data.language
    if data.onboarding_completed is not None:
        user.onboarding_completed = data.onboarding_completed
    _TIME_RE = re.compile(r"^\d{2}:\d{2}$")
    if data.notification_morning_time is not None:
        if not _TIME_RE.match(data.notification_morning_time):
            raise HTTPException(status_code=400, detail="Invalid time format, use HH:MM")
        user.notification_morning_time = data.notification_morning_time
    if data.notification_evening_time is not None:
        if not _TIME_RE.match(data.notification_evening_time):
            raise HTTPException(status_code=400, detail="Invalid time format, use HH:MM")
        user.notification_evening_time = data.notification_evening_time
    if data.notify_task_reminders is not None:
        user.notify_task_reminders = data.notify_task_reminders
    if data.notify_email_daily is not None:
        user.notify_email_daily = data.notify_email_daily
    if data.notify_email_weekly is not None:
        user.notify_email_weekly = data.notify_email_weekly
    if data.streak_protection is not None:
        user.streak_protection = data.streak_protection
    if data.theme is not None:
        if data.theme not in ("light", "dark", "system"):
            raise HTTPException(status_code=400, detail="Invalid theme, use 'light' or 'dark'")
        user.theme = data.theme
    await db.flush()
    return user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.hashed_password or not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    await db.flush()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    challenge_ids = (await db.execute(
        select(ChallengeInstance.challenge_id).where(ChallengeInstance.user_id == user.id)
    )).scalars().all()

    await db.execute(delete(DailyTaskInstance).where(DailyTaskInstance.user_id == user.id))
    await db.execute(delete(ChallengeInstance).where(ChallengeInstance.user_id == user.id))
    if challenge_ids:
        await db.execute(delete(Challenge).where(Challenge.id.in_(challenge_ids)))
    await db.execute(delete(UserDevice).where(UserDevice.user_id == user.id))
    await db.execute(delete(NotificationLog).where(NotificationLog.user_id == user.id))
    await db.delete(user)
    await db.flush()
