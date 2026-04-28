import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.user_device import UserDevice
from app.schemas.notifications import DeviceOut, PushSubscriptionRequest

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/vapid-public-key")
async def vapid_key():
    return {"vapid_public_key": settings.VAPID_PUBLIC_KEY or "mock-vapid-key"}


@router.post("/subscribe", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def subscribe(
    data: PushSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    subscription_json = json.dumps(
        {"endpoint": data.endpoint, "keys": data.keys.model_dump()}
    )
    device = UserDevice(
        user_id=user.id,
        push_subscription=subscription_json,
        user_agent=data.user_agent,
    )
    db.add(device)
    await db.flush()
    return device


@router.get("/devices", response_model=list[DeviceOut])
async def list_devices(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(UserDevice).where(UserDevice.user_id == user.id))
    return list(result.scalars().all())


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserDevice).where(UserDevice.id == device_id, UserDevice.user_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    await db.delete(device)
