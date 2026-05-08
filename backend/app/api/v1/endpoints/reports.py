from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.reports import ChallengeReport, DayStats, MomentumReport, MonthlyReport, StreakReport
from app.services.report_service import challenge_report, daily_report, momentum_report, monthly_report, streak_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/momentum", response_model=MomentumReport)
async def get_momentum(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await momentum_report(db, user.id)


@router.get("/streak", response_model=StreakReport)
async def get_streak(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await streak_report(db, user.id)


@router.get("/daily/{report_date}", response_model=DayStats)
async def get_daily(
    report_date: date,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await daily_report(db, user.id, report_date)


@router.get("/monthly/{year}/{month}", response_model=MonthlyReport)
async def get_monthly(
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not (1 <= month <= 12):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month")
    return await monthly_report(db, user.id, year, month)


@router.get("/challenge/{instance_id}", response_model=ChallengeReport)
async def get_challenge(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await challenge_report(db, user.id, instance_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
