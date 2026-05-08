import secrets

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.telegram_service import send_telegram_raw

router = APIRouter(tags=["telegram"])


@router.post("/users/me/telegram/generate-code")
async def generate_telegram_code(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    code = secrets.token_urlsafe(8)
    user.telegram_linking_code = code
    await db.flush()
    bot_url = f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={code}"
    return {"code": code, "bot_url": bot_url}


@router.delete("/users/me/telegram", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_telegram(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.telegram_chat_id = None
    user.telegram_linking_code = None
    await db.flush()


@router.post("/telegram/webhook", include_in_schema=False)
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        data = await request.json()
    except Exception:
        return {"ok": True}

    message = data.get("message") or data.get("edited_message", {})
    if not message:
        return {"ok": True}

    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id")
    if not chat_id:
        return {"ok": True}

    if text.startswith("/start"):
        parts = text.split(None, 1)
        code = parts[1].strip() if len(parts) > 1 else ""

        if code:
            result = await db.execute(
                select(User).where(User.telegram_linking_code == code)
            )
            user = result.scalar_one_or_none()
            if user:
                user.telegram_chat_id = chat_id
                user.telegram_linking_code = None
                await db.commit()
                await send_telegram_raw(
                    chat_id,
                    "✅ <b>Telegram подключён!</b>\n\nТеперь вы будете получать уведомления ChallengeTracker здесь.",
                )
            else:
                await send_telegram_raw(chat_id, "❌ Код недействителен или устарел. Сгенерируйте новый в настройках приложения.")
        else:
            await send_telegram_raw(
                chat_id,
                "👋 Привет! Это бот ChallengeTracker.\n\nДля подключения аккаунта зайдите в Настройки приложения и нажмите «Подключить Telegram».",
            )

    return {"ok": True}
