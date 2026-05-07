import pytz
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserOut, UserUpdateRequest

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
    if data.timezone is not None:
        if data.timezone not in pytz.all_timezones:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timezone")
        user.timezone = data.timezone
    await db.flush()
    return user
