from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    email: str | None
    phone: str | None
    timezone: str
    language: str
    onboarding_completed: bool
    notification_morning_time: str | None
    notification_evening_time: str | None
    notify_task_reminders: bool
    telegram_chat_id: int | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    timezone: str | None = None
    language: str | None = None
    onboarding_completed: bool | None = None
    notification_morning_time: str | None = None
    notification_evening_time: str | None = None
    notify_task_reminders: bool | None = None
