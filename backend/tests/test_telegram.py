"""Tests for Telegram bot linking endpoints."""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

pytestmark = pytest.mark.asyncio


# ── generate code ─────────────────────────────────────────────────────────────

async def test_generate_telegram_code(client: AsyncClient):
    """Authenticated user gets a code and bot_url."""
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/users/me/telegram/generate-code",
                          headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert "code" in data
    assert "bot_url" in data
    assert "t.me/" in data["bot_url"]
    assert data["code"] in data["bot_url"]


async def test_generate_telegram_code_unauthenticated(client: AsyncClient):
    r = await client.post("/api/v1/users/me/telegram/generate-code")
    assert r.status_code == 403


# ── webhook ───────────────────────────────────────────────────────────────────

async def test_webhook_start_with_valid_code(client: AsyncClient):
    """Sending /start <code> to webhook links the account."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    # Generate linking code
    r = await client.post("/api/v1/users/me/telegram/generate-code", headers=headers)
    code = r.json()["code"]

    # Simulate Telegram sending /start <code>
    r = await client.post("/api/v1/telegram/webhook", json={
        "message": {
            "text": f"/start {code}",
            "chat": {"id": 123456789},
        }
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True

    # Account should now be linked
    r = await client.get("/api/v1/users/me", headers=headers)
    assert r.json()["telegram_chat_id"] == 123456789


async def test_webhook_start_invalid_code(client: AsyncClient):
    """Invalid code returns ok:True but does not link any account."""
    r = await client.post("/api/v1/telegram/webhook", json={
        "message": {
            "text": "/start invalidcode999",
            "chat": {"id": 999},
        }
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


async def test_webhook_start_no_code(client: AsyncClient):
    """/start without code returns ok:True (sends greeting)."""
    r = await client.post("/api/v1/telegram/webhook", json={
        "message": {
            "text": "/start",
            "chat": {"id": 111},
        }
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


async def test_webhook_code_consumed_after_use(client: AsyncClient):
    """A code can only be used once — second use finds no user."""
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/users/me/telegram/generate-code",
                          headers=auth_headers(tokens))
    code = r.json()["code"]

    # First use — links
    await client.post("/api/v1/telegram/webhook", json={
        "message": {"text": f"/start {code}", "chat": {"id": 111}}
    })

    # Second use — code is cleared, should not link anything
    r = await client.post("/api/v1/telegram/webhook", json={
        "message": {"text": f"/start {code}", "chat": {"id": 222}}
    })
    assert r.status_code == 200
    # Original chat_id unchanged
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.json()["telegram_chat_id"] == 111


# ── unlink ────────────────────────────────────────────────────────────────────

async def test_unlink_telegram(client: AsyncClient):
    """DELETE /users/me/telegram clears telegram_chat_id."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    # Link first
    r = await client.post("/api/v1/users/me/telegram/generate-code", headers=headers)
    code = r.json()["code"]
    await client.post("/api/v1/telegram/webhook", json={
        "message": {"text": f"/start {code}", "chat": {"id": 42}}
    })

    # Unlink
    r = await client.delete("/api/v1/users/me/telegram", headers=headers)
    assert r.status_code == 204

    r = await client.get("/api/v1/users/me", headers=headers)
    assert r.json()["telegram_chat_id"] is None


async def test_unlink_telegram_unauthenticated(client: AsyncClient):
    r = await client.delete("/api/v1/users/me/telegram")
    assert r.status_code == 403
