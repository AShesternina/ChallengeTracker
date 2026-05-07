import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

pytestmark = pytest.mark.asyncio


async def test_register_email_success(client: AsyncClient):
    r = await client.post("/api/v1/auth/register/email", json={
        "email": "new@example.com",
        "password": "password123",
        "timezone": "UTC",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "pass123", "timezone": "UTC"}
    await client.post("/api/v1/auth/register/email", json=payload)
    r = await client.post("/api/v1/auth/register/email", json=payload)
    assert r.status_code == 400


async def test_register_short_password(client: AsyncClient):
    r = await client.post("/api/v1/auth/register/email", json={
        "email": "short@example.com",
        "password": "123",
        "timezone": "UTC",
    })
    assert r.status_code == 422


async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register/email", json={
        "email": "login@example.com", "password": "pass1234", "timezone": "UTC"
    })
    r = await client.post("/api/v1/auth/login/email", json={
        "email": "login@example.com", "password": "pass1234"
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register/email", json={
        "email": "wp@example.com", "password": "correct", "timezone": "UTC"
    })
    r = await client.post("/api/v1/auth/login/email", json={
        "email": "wp@example.com", "password": "wrong"
    })
    assert r.status_code == 401


async def test_login_unknown_email(client: AsyncClient):
    r = await client.post("/api/v1/auth/login/email", json={
        "email": "nobody@example.com", "password": "pass"
    })
    assert r.status_code == 401


async def test_get_me(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "test@example.com"
    assert data["timezone"] == "UTC"


async def test_get_me_unauthenticated(client: AsyncClient):
    r = await client.get("/api/v1/users/me")
    assert r.status_code == 403


async def test_refresh_token(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    new_tokens = r.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    # Verify new token is valid by making an authenticated request
    r2 = await client.get("/api/v1/users/me", headers=auth_headers(new_tokens))
    assert r2.status_code == 200


async def test_refresh_invalid_token(client: AsyncClient):
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"})
    assert r.status_code == 401


async def test_update_timezone(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"timezone": "Europe/Moscow"}, headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["timezone"] == "Europe/Moscow"


async def test_update_timezone_invalid(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"timezone": "Mars/Phobos"}, headers=auth_headers(tokens))
    assert r.status_code == 400


async def test_logout_revokes_refresh_token(client: AsyncClient):
    tokens = await register_and_login(client)
    await client.post("/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]})
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 401


async def test_register_duplicate_email_does_not_leak(client: AsyncClient):
    """Duplicate email error must not reveal whether email is registered."""
    payload = {"email": "dup2@example.com", "password": "pass123", "timezone": "UTC"}
    await client.post("/api/v1/auth/register/email", json=payload)
    r = await client.post("/api/v1/auth/register/email", json=payload)
    assert r.status_code == 400
    assert "already registered" not in r.json().get("detail", "")


async def test_get_me_includes_language(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert "language" in data
    assert data["language"] in ("en", "ru", "es", "pt")


async def test_register_default_language(client: AsyncClient):
    """Newly registered user gets language='en' (test client IP → fallback to Accept-Language → 'en')."""
    await client.post("/api/v1/auth/register/email", json={
        "email": "langtest@example.com", "password": "pass123", "timezone": "UTC",
    })
    r = await client.post("/api/v1/auth/login/email", json={
        "email": "langtest@example.com", "password": "pass123",
    })
    tokens = r.json()
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.json()["language"] == "en"


async def test_update_language(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"language": "ru"}, headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["language"] == "ru"


async def test_update_language_invalid(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"language": "zh"}, headers=auth_headers(tokens))
    assert r.status_code == 400


async def test_create_challenge_invalid_duration(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/challenges", json={
        "title": "Bad", "type": "single",
        "default_duration_days": 0, "tasks_per_day": 1, "task_times": ["08:00"],
    }, headers=auth_headers(tokens))
    assert r.status_code == 422


async def test_create_challenge_invalid_tasks_per_day(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/challenges", json={
        "title": "Bad", "type": "single",
        "default_duration_days": 7, "tasks_per_day": 99, "task_times": ["08:00"],
    }, headers=auth_headers(tokens))
    assert r.status_code == 422
