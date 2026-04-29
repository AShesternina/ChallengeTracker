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
    assert "already registered" in r.json()["detail"]


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
    assert new_tokens["access_token"] != tokens["access_token"]


async def test_refresh_invalid_token(client: AsyncClient):
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"})
    assert r.status_code == 401


async def test_update_timezone(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"timezone": "Europe/Moscow"}, headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["timezone"] == "Europe/Moscow"
