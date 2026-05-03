from datetime import date

import pytz
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.daily import DailySummary, DailyTaskOut
from app.services.daily_task_service import complete_task, get_daily_tasks, reset_task, skip_task

router = APIRouter(tags=["daily"])


def _user_today(user: User) -> date:
    try:
        tz = pytz.timezone(user.timezone)
    except Exception:
        tz = pytz.UTC
    return date.today()  # server-side date; clients can pass ?date= to override


@router.get("/daily/today", response_model=DailySummary)
async def get_today(
    target_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    d = target_date or _user_today(user)
    return await get_daily_tasks(db, user.id, d)


@router.post("/tasks/{task_id}/complete", response_model=DailyTaskOut)
async def complete(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await complete_task(db, task_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/tasks/{task_id}/skip", response_model=DailyTaskOut)
async def skip(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await skip_task(db, task_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/tasks/{task_id}/reset", response_model=DailyTaskOut)
async def reset(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await reset_task(db, task_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
