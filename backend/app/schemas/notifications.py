from pydantic import BaseModel


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    user_agent: str | None = None


class DeviceOut(BaseModel):
    id: int
    user_agent: str | None

    model_config = {"from_attributes": True}
