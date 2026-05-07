from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    email: str | None
    phone: str | None
    timezone: str
    language: str
    onboarding_completed: bool
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    timezone: str | None = None
    language: str | None = None
    onboarding_completed: bool | None = None
