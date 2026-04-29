import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

_engine = create_async_engine(settings.async_database_url, echo=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def ensure_tables():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def db():
    """Transaction-isolated session — rolls back after each test."""
    async with _engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(
            bind=conn,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    async def _override():
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


# --- helpers ----------------------------------------------------------------

async def register_and_login(client: AsyncClient, email: str = "test@example.com", password: str = "secret123") -> dict:
    await client.post("/api/v1/auth/register/email", json={"email": email, "password": password, "timezone": "UTC"})
    r = await client.post("/api/v1/auth/login/email", json={"email": email, "password": password})
    return r.json()


def auth_headers(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}
