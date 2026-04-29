"""
Engine is created INSIDE the client fixture so it lives in the same
event loop as the test — avoids asyncpg "Future attached to different loop".
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

_SEED_TEMPLATES = [
    {"title": "Morning Workout", "description": "Daily morning exercise", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["07:00"]', "icon": "💪"},
    {"title": "Reading Habit", "description": "Read 20 pages every day", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "📚"},
    {"title": "Meditation", "description": "Morning and evening meditation", "type": "multi",
     "default_duration_days": 21, "tasks_per_day": 2, "task_times": '["08:00","20:00"]', "icon": "🧘"},
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
