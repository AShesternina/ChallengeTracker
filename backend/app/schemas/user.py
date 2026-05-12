from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    email: str | None
    phone: str | None
    name: str | None
    timezone: str
    language: str
    onboarding_completed: bool
    notification_morning_time: str | None
    notification_evening_time: str | None
    notify_task_reminders: bool
    notify_email_daily: bool = False
    notify_email_weekly: bool = False
    streak_protection: bool
    theme: str
    telegram_chat_id: int | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserUpdateRequest(BaseModel):
    name: str | None = None
    timezone: str | None = None
    language: str | None = None
    onboarding_completed: bool | None = None
    notification_morning_time: str | None = None
    notification_evening_time: str | None = None
    notify_task_reminders: bool | None = None
    notify_email_daily: bool | None = None
    notify_email_weekly: bool | None = None
    streak_protection: bool | None = None
    theme: str | None = None
