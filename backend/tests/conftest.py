"""
Engine is created INSIDE the client fixture so it lives in the same
event loop as the test — avoids asyncpg "Future attached to different loop".
"""

import os
import pytest

if not os.getenv("PYTEST_ALLOW"):
    raise RuntimeError(
        "\n\n"
        "  ⛔  Tests are blocked on this environment.\n"
        "  Running tests truncates ALL database tables and destroys real user data.\n"
        "  Tests must only run on a local Docker stack.\n\n"
        "  To enable: set PYTEST_ALLOW=1 in the backend service environment (docker-compose.yml).\n"
    )
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

_SEED_TEMPLATES = [
    # Health
    {"title": "Healthy Sleep", "description": "Go to bed on time every night", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["22:30"]', "icon": "😴"},
    {"title": "8 Glasses of Water", "description": "Stay hydrated throughout the day", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 4, "task_times": '["09:00","12:00","15:00","19:00"]', "icon": "💧"},
    {"title": "Daily Vitamins", "description": "Take your vitamins morning and evening", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 2, "task_times": '["08:00","20:00"]', "icon": "💊"},
    {"title": "No Sugar", "description": "Avoid sugar for the whole day", "type": "all_day",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": None, "icon": "🍭"},
    # Productivity
    {"title": "Morning Pages", "description": "Write 3 pages by hand right after waking up", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["07:00"]', "icon": "✍️"},
    {"title": "Pomodoro Method", "description": "Work in focused 25-minute sessions", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 4, "task_times": '["09:00","11:00","14:00","16:00"]', "icon": "🍅"},
    {"title": "No Social Media Until Noon", "description": "Keep your mornings free from social media", "type": "all_day",
     "default_duration_days": 14, "tasks_per_day": 1, "task_times": None, "icon": "📵"},
    {"title": "Evening Review", "description": "Reflect on your day: wins, lessons, tomorrow's focus", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "📝"},
    # Sport
    {"title": "Morning Workout", "description": "Daily morning exercise session", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["07:00"]', "icon": "💪"},
    {"title": "Push-ups 3x Day", "description": "Build upper body strength with daily push-up sets", "type": "multi",
     "default_duration_days": 21, "tasks_per_day": 3, "task_times": '["08:00","13:00","19:00"]', "icon": "🏋️"},
    {"title": "10,000 Steps", "description": "Walk at least 10,000 steps every day", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🚶"},
    {"title": "Cold Shower", "description": "Start your day with a cold shower for energy and resilience", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["07:30"]', "icon": "🚿"},
    # Mental Health
    {"title": "Meditation", "description": "Daily mindfulness practice", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["08:00"]', "icon": "🧘"},
    {"title": "Breathing Practice", "description": "Calm your mind with breathing exercises", "type": "multi",
     "default_duration_days": 21, "tasks_per_day": 3, "task_times": '["08:00","13:00","21:00"]', "icon": "🌬️"},
    {"title": "Gratitude Journal", "description": "Write down 3 things you are grateful for today", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🙏"},
    {"title": "Phone-Free Evening", "description": "No phone for one hour before bed — better sleep guaranteed", "type": "all_day",
     "default_duration_days": 14, "tasks_per_day": 1, "task_times": None, "icon": "🌙"},
]


@pytest_asyncio.fixture
async def client():
    # Engine created here — same event loop as the test function
    engine = create_async_engine(settings.async_database_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as session:
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(
                text(f'TRUNCATE TABLE "{table.name}" RESTART IDENTITY CASCADE')
            )
        # Reseed templates after full truncation
        from app.models.challenge import ChallengeTemplate
        for tpl in _SEED_TEMPLATES:
            session.add(ChallengeTemplate(**tpl))
        await session.commit()

    async def _override():
        async with SessionLocal() as db:
            try:
                yield db
                await db.commit()
            except Exception:
                await db.rollback()
                raise

    app.dependency_overrides[get_db] = _override

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await engine.dispose()


# --- helpers ----------------------------------------------------------------

async def register_and_login(
    client: AsyncClient,
    email: str = "test@example.com",
    password: str = "secret123",
) -> dict:
    await client.post(
        "/api/v1/auth/register/email",
        json={"email": email, "password": password, "timezone": "UTC"},
    )
    r = await client.post(
        "/api/v1/auth/login/email",
        json={"email": email, "password": password},
    )
    return r.json()


def auth_headers(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}
