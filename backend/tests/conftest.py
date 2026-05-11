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
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["22:30"]', "icon": "😴", "slug": "healthy-sleep"},
    {"title": "8 Glasses of Water", "description": "Stay hydrated throughout the day", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 4, "task_times": '["09:00","12:00","15:00","19:00"]', "icon": "💧", "slug": "8-glasses-of-water"},
    {"title": "Daily Vitamins", "description": "Take your vitamins morning and evening", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 2, "task_times": '["08:00","20:00"]', "icon": "💊", "slug": "daily-vitamins"},
    {"title": "No Sugar", "description": "Avoid sugar for the whole day", "type": "all_day",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": None, "icon": "🍭", "slug": "no-sugar"},
    # Productivity
    {"title": "Morning Pages", "description": "Write 3 pages by hand right after waking up", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["07:00"]', "icon": "✍️", "slug": "morning-pages"},
    {"title": "Pomodoro Method", "description": "Work in focused 25-minute sessions", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 4, "task_times": '["09:00","11:00","14:00","16:00"]', "icon": "🍅", "slug": "pomodoro-method"},
    {"title": "No Social Media Until Noon", "description": "Keep your mornings free from social media", "type": "all_day",
     "default_duration_days": 14, "tasks_per_day": 1, "task_times": None, "icon": "📵", "slug": "no-social-media-until-noon"},
    {"title": "Evening Review", "description": "Reflect on your day: wins, lessons, tomorrow's focus", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "📝", "slug": "evening-review"},
    # Sport
    {"title": "Morning Workout", "description": "Daily morning exercise session", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["07:00"]', "icon": "💪", "slug": "morning-workout"},
    {"title": "Push-ups 3x Day", "description": "Build upper body strength with daily push-up sets", "type": "multi",
     "default_duration_days": 21, "tasks_per_day": 3, "task_times": '["08:00","13:00","19:00"]', "icon": "🏋️", "slug": "push-ups-3x-day"},
    {"title": "10,000 Steps", "description": "Walk at least 10,000 steps every day", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🚶", "slug": "10000-steps"},
    {"title": "Cold Shower", "description": "Start your day with a cold shower for energy and resilience", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["07:30"]', "icon": "🚿", "slug": "cold-shower"},
    # Mental Health
    {"title": "Meditation", "description": "Daily mindfulness practice", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["08:00"]', "icon": "🧘", "slug": "meditation"},
    {"title": "Breathing Practice", "description": "Calm your mind with breathing exercises", "type": "multi",
     "default_duration_days": 21, "tasks_per_day": 3, "task_times": '["08:00","13:00","21:00"]', "icon": "🌬️", "slug": "breathing-practice"},
    {"title": "Gratitude Journal", "description": "Write down 3 things you are grateful for today", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🙏", "slug": "gratitude-journal"},
    {"title": "Phone-Free Evening", "description": "No phone for one hour before bed — better sleep guaranteed", "type": "all_day",
     "default_duration_days": 14, "tasks_per_day": 1, "task_times": None, "icon": "🌙", "slug": "phone-free-evening"},
    # Health & Nutrition (v2)
    {"title": "Blood Pressure Check", "description": "Track your blood pressure 3 times a day", "type": "multi",
     "default_duration_days": 30, "tasks_per_day": 3, "task_times": '["08:00","14:00","20:00"]', "icon": "💓", "slug": "blood-pressure-check"},
    {"title": "Daily Vegetables", "description": "Eat vegetables every day — your body will thank you", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🥦", "slug": "daily-vegetables"},
    # Education (v2)
    {"title": "Read 20 Pages", "description": "Read at least 20 pages every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "📖", "slug": "read-20-pages"},
    {"title": "1 Course Lesson Daily", "description": "Complete one lesson of your online course every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["19:00"]', "icon": "🎓", "slug": "1-course-lesson-daily"},
    {"title": "Learn 20 Words", "description": "Learn 20 new words in a foreign language every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["09:00"]', "icon": "🔤", "slug": "learn-20-words"},
    {"title": "Coding Practice", "description": "Practice coding for at least 30 minutes every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["10:00"]', "icon": "💻", "slug": "coding-practice"},
    # Productivity (v2)
    {"title": "Deep Work 2 Hours", "description": "Work with full focus for 2 hours without distractions", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["10:00"]', "icon": "🎯", "slug": "deep-work-2-hours"},
    {"title": "Daily Planning", "description": "Plan tomorrow every evening — 10 minutes for a better day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "📋", "slug": "daily-planning"},
    {"title": "3 Main Tasks", "description": "Pick 3 most important tasks every morning and complete them", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["09:00"]', "icon": "✅", "slug": "3-main-tasks"},
    # Home & Order (v2)
    {"title": "15 Min Cleaning", "description": "Spend 15 minutes cleaning every day — small steps, big results", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["18:00"]', "icon": "🧹", "slug": "15-min-cleaning"},
    {"title": "Clean Desk", "description": "Keep your desk clean every evening before bed", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["20:00"]', "icon": "🖥️", "slug": "clean-desk"},
    {"title": "Declutter", "description": "Find one thing to throw away, donate, or organize every day", "type": "single",
     "default_duration_days": 21, "tasks_per_day": 1, "task_times": '["18:00"]', "icon": "📦", "slug": "declutter"},
    {"title": "Minimalism 1 Item", "description": "Let go of one unnecessary item every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["18:00"]', "icon": "🗑️", "slug": "minimalism-1-item"},
    # Finance (v2)
    {"title": "Daily Expense Tracking", "description": "Log all your expenses every evening", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "💸", "slug": "daily-expense-tracking"},
    {"title": "No Spend Day", "description": "Spend no money today — practice financial discipline", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "💰", "slug": "no-spend-day"},
    {"title": "Daily Savings", "description": "Set aside a fixed amount every day — build your safety net", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "🏦", "slug": "daily-savings"},
    {"title": "Financial Journal", "description": "Write down your financial goals and progress every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["21:00"]', "icon": "📓", "slug": "financial-journal"},
    # Quit Habits (v2)
    {"title": "No Alcohol", "description": "Stay alcohol-free — every sober day counts", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🍷", "slug": "no-alcohol"},
    {"title": "No Smoking", "description": "Quit smoking — your lungs will start recovering in 24 hours", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "🚭", "slug": "no-smoking"},
    {"title": "No Late Snacks", "description": "Stop eating after 8pm — better sleep and metabolism", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["20:00"]', "icon": "🌙", "slug": "no-late-snacks"},
    # Relationships (v2)
    {"title": "Call Loved Ones", "description": "Call a family member or close friend every day", "type": "single",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": '["19:00"]', "icon": "📞", "slug": "call-loved-ones"},
    {"title": "Family Time", "description": "Spend quality time with family — phones away", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "👨‍👩‍👧", "slug": "family-time"},
    {"title": "Meet a Friend", "description": "Meet or meaningfully connect with a friend every day", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "👥", "slug": "meet-a-friend"},
    {"title": "Self-Care Day", "description": "Do something just for yourself — you deserve it", "type": "all_day",
     "default_duration_days": 30, "tasks_per_day": 1, "task_times": None, "icon": "💆", "slug": "self-care-day"},
]


@pytest_asyncio.fixture
async def client():
    # Engine created here — same event loop as the test function
    engine = create_async_engine(settings.async_database_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
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
