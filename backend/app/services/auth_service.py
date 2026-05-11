import random
import secrets
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


async def register_email(db: AsyncSession, data: RegisterEmailRequest, language: str = "en") -> User:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise AuthError("Invalid email or password")

    token = secrets.token_urlsafe(32)
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        timezone=data.timezone,
        language=language,
        is_verified=False,
        email_verification_token=token,
    )
    db.add(user)
    await db.flush()
    await _send_verification_email(user.email, token, language)
    return user


async def _send_verification_email(email: str, token: str, lang: str = "en") -> None:
    from app.core.config import settings
    from app.services.email_service import email_adapter

    base_url = settings.FRONTEND_URL or "https://tracker.shura.pro"
    link = f"{base_url}/verify-email?token={token}"

    subjects = {
        "en": "Confirm your email — ChallengeTracker",
        "ru": "Подтвердите email — ChallengeTracker",
        "es": "Confirma tu correo — ChallengeTracker",
        "pt": "Confirme seu e-mail — ChallengeTracker",
    }
    bodies = {
        "en": ("Confirm your email", f"Click the link to verify your account:\n{link}",
               f"<h2>Almost there! 🎉</h2><p>Click the button below to confirm your email and start your first challenge.</p><p><a href='{link}' style='display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold'>Confirm email →</a></p><p style='color:#888;font-size:12px'>Or copy this link: {link}</p>"),
        "ru": ("Подтвердите email", f"Перейдите по ссылке, чтобы подтвердить аккаунт:\n{link}",
               f"<h2>Почти готово! 🎉</h2><p>Нажмите кнопку, чтобы подтвердить email и начать первый челлендж.</p><p><a href='{link}' style='display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold'>Подтвердить email →</a></p><p style='color:#888;font-size:12px'>Или скопируйте ссылку: {link}</p>"),
        "es": ("Confirma tu correo", f"Haz clic en el enlace para verificar tu cuenta:\n{link}",
               f"<h2>¡Casi listo! 🎉</h2><p>Haz clic en el botón para confirmar tu correo y comenzar tu primer desafío.</p><p><a href='{link}' style='display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold'>Confirmar correo →</a></p><p style='color:#888;font-size:12px'>O copia este enlace: {link}</p>"),
        "pt": ("Confirme seu e-mail", f"Clique no link para verificar sua conta:\n{link}",
               f"<h2>Quase lá! 🎉</h2><p>Clique no botão para confirmar seu e-mail e começar seu primeiro desafio.</p><p><a href='{link}' style='display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold'>Confirmar e-mail →</a></p><p style='color:#888;font-size:12px'>Ou copie este link: {link}</p>"),
    }

    subject, text, html = bodies.get(lang, bodies["en"])
    await email_adapter.send(email, subjects.get(lang, subjects["en"]), html, text)


async def verify_email_token(db: AsyncSession, token: str) -> None:
    result = await db.execute(select(User).where(User.email_verification_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise AuthError("Invalid or expired verification link")
    user.is_verified = True
    user.email_verification_token = None
    await db.flush()


async def resend_verification(db: AsyncSession, user: User) -> None:
    if user.is_verified:
        raise AuthError("Email already verified")
    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    await db.flush()
    await _send_verification_email(user.email, token, user.language)


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
