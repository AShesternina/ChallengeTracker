import random
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.redis import get_redis
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.auth import RegisterEmailRequest, RegisterPhoneRequest, LoginEmailRequest, TokenResponse

REFRESH_TOKEN_BLACKLIST_PREFIX = "blacklist:refresh:"


class AuthError(Exception):
    pass


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def register_email(db: AsyncSession, data: RegisterEmailRequest) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise AuthError("Invalid email or password")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        timezone=data.timezone,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


async def register_phone(db: AsyncSession, data: RegisterPhoneRequest) -> str:
    existing = await db.execute(select(User).where(User.phone == data.phone))
    user = existing.scalar_one_or_none()

    otp = _generate_otp()

    if user:
        user.otp_code = otp
    else:
        user = User(phone=data.phone, timezone=data.timezone, otp_code=otp)
        db.add(user)

    await db.flush()
    # In production: send OTP via SMS. Mock: return OTP directly.
    return otp


async def verify_otp(db: AsyncSession, phone: str, otp: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if not user or user.otp_code != otp:
        raise AuthError("Invalid OTP")

    user.otp_code = None
    user.is_verified = True
    await db.flush()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def login_email(db: AsyncSession, data: LoginEmailRequest) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise AuthError("Invalid email or password")

    if not user.is_active:
        raise AuthError("Account disabled")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if not user_id or token_type != "refresh":
        raise AuthError("Invalid refresh token")

    redis = get_redis()
    if await redis.get(f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{refresh_token}"):
        raise AuthError("Token has been revoked")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise AuthError("User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def logout(refresh_token: str) -> None:
    from app.core.config import settings
    payload = decode_token(refresh_token)
    exp = payload.get("exp")
    redis = get_redis()
    ttl = max(int(exp - __import__("time").time()), 1) if exp else settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await redis.setex(f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{refresh_token}", ttl, "1")
