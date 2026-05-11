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


# ── notification settings ─────────────────────────────────────────────────────

async def test_user_has_notification_fields(client: AsyncClient):
    """UserOut includes notification time fields and notify_task_reminders."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    data = r.json()
    assert "notification_morning_time" in data
    assert "notification_evening_time" in data
    assert "notify_task_reminders" in data
    assert data["notify_task_reminders"] is False


async def test_update_notification_morning_time(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"notification_morning_time": "07:30"},
                           headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["notification_morning_time"] == "07:30"


async def test_update_notification_evening_time(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"notification_evening_time": "22:00"},
                           headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["notification_evening_time"] == "22:00"


async def test_update_notification_time_invalid_format(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"notification_morning_time": "8:00"},
                           headers=auth_headers(tokens))
    assert r.status_code == 400


async def test_update_notify_task_reminders(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.patch("/api/v1/users/me", json={"notify_task_reminders": True},
                           headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["notify_task_reminders"] is True


async def test_user_has_streak_protection_enabled_by_default(client: AsyncClient):
    """New user has streak_protection=True by default."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    data = r.json()
    assert "streak_protection" in data
    assert data["streak_protection"] is True


async def test_update_streak_protection(client: AsyncClient):
    """PATCH /users/me with streak_protection=False persists."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    r = await client.patch("/api/v1/users/me", json={"streak_protection": False}, headers=headers)
    assert r.status_code == 200
    assert r.json()["streak_protection"] is False
    r2 = await client.get("/api/v1/users/me", headers=headers)
    assert r2.json()["streak_protection"] is False


async def test_user_has_telegram_chat_id_null(client: AsyncClient):
    """New user has telegram_chat_id=null."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    data = r.json()
    assert "telegram_chat_id" in data
    assert data["telegram_chat_id"] is None


# ── onboarding_completed ──────────────────────────────────────────────────────

async def test_register_has_onboarding_completed_false(client: AsyncClient):
    """New user should have onboarding_completed=False."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert "onboarding_completed" in data
    assert data["onboarding_completed"] is False


async def test_update_onboarding_completed(client: AsyncClient):
    """PATCH /users/me with onboarding_completed=True persists and is returned."""
    tokens = await register_and_login(client)
    r = await client.patch(
        "/api/v1/users/me",
        json={"onboarding_completed": True},
        headers=auth_headers(tokens),
    )
    assert r.status_code == 200
    assert r.json()["onboarding_completed"] is True

    # Verify persisted across requests
    r2 = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r2.json()["onboarding_completed"] is True


# ── account deletion ──────────────────────────────────────────────────────────

async def test_delete_account(client: AsyncClient):
    """DELETE /users/me returns 204 and the account is gone."""
    tokens = await register_and_login(client)
    r = await client.delete("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 204

    # Token no longer valid — can't fetch /me
    r2 = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r2.status_code in (401, 403)


async def test_delete_account_unauthenticated(client: AsyncClient):
    """DELETE /users/me without auth returns 403."""
    r = await client.delete("/api/v1/users/me")
    assert r.status_code == 403


async def test_delete_account_cascades_challenges_and_tasks(client: AsyncClient):
    """Deleting account removes all challenges, instances and tasks."""
    from datetime import date
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    today = date.today().isoformat()

    # Create and start a challenge
    r = await client.post("/api/v1/challenges", json={
        "title": "To Delete", "type": "single",
        "default_duration_days": 7, "tasks_per_day": 1, "task_times": ["08:00"],
    }, headers=headers)
    cid = r.json()["id"]
    r = await client.post("/api/v1/challenges/start",
                          json={"challenge_id": cid, "start_date": today},
                          headers=headers)
    assert r.status_code == 201

    # Generate tasks
    await client.get("/api/v1/daily/today", headers=headers)

    # Delete account
    r = await client.delete("/api/v1/users/me", headers=headers)
    assert r.status_code == 204

    # Register a new user with same email — should succeed (no conflict)
    r = await client.post("/api/v1/auth/register/email", json={
        "email": "test@example.com", "password": "newpass123", "timezone": "UTC",
    })
    assert r.status_code == 201


# ── theme ─────────────────────────────────────────────────────────────────────

async def test_user_has_theme_field_default_system(client: AsyncClient):
    """New user has theme='system' by default."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert "theme" in data
    assert data["theme"] == "system"


async def test_update_theme_valid_values(client: AsyncClient):
    """PATCH /users/me with theme='dark'/'light'/'system' persists; invalid value rejected."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    for value in ("dark", "light", "system"):
        r = await client.patch("/api/v1/users/me", json={"theme": value}, headers=headers)
        assert r.status_code == 200
        assert r.json()["theme"] == value

    r = await client.patch("/api/v1/users/me", json={"theme": "neon"}, headers=headers)
    assert r.status_code == 400


# ── change password ───────────────────────────────────────────────────────────

async def test_change_password_success(client: AsyncClient):
    """POST /users/me/change-password with correct current password changes it."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    r = await client.post("/api/v1/users/me/change-password",
                          json={"current_password": "secret123", "new_password": "newpass456"},
                          headers=headers)
    assert r.status_code == 204

    # Old password should no longer work
    r2 = await client.post("/api/v1/auth/login/email",
                           json={"email": "test@example.com", "password": "secret123"})
    assert r2.status_code == 401

    # New password should work
    r3 = await client.post("/api/v1/auth/login/email",
                           json={"email": "test@example.com", "password": "newpass456"})
    assert r3.status_code == 200


async def test_change_password_wrong_current(client: AsyncClient):
    """Wrong current password returns 400."""
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/users/me/change-password",
                          json={"current_password": "wrongpass", "new_password": "newpass456"},
                          headers=auth_headers(tokens))
    assert r.status_code == 400


async def test_change_password_unauthenticated(client: AsyncClient):
    """POST /users/me/change-password without auth returns 403."""
    r = await client.post("/api/v1/users/me/change-password",
                          json={"current_password": "secret123", "new_password": "newpass456"})
    assert r.status_code == 403


# ── email verification ────────────────────────────────────────────────────────

async def test_register_sets_is_verified_false(client: AsyncClient):
    """After registration, is_verified=False until email is confirmed."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["is_verified"] is False


async def test_verify_email_with_valid_token(client: AsyncClient):
    """GET /auth/verify-email with valid token sets is_verified=True."""
    import secrets
    from sqlalchemy import select
    from app.core.database import AsyncSession
    from app.models.user import User

    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    # Inject a known token directly via the app's DB session
    known_token = secrets.token_urlsafe(16)
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one()
        user.email_verification_token = known_token
        await db.commit()

    r = await client.get(f"/api/v1/auth/verify-email?token={known_token}")
    assert r.status_code == 200

    r2 = await client.get("/api/v1/users/me", headers=headers)
    assert r2.json()["is_verified"] is True


async def test_verify_email_invalid_token(client: AsyncClient):
    """GET /auth/verify-email with invalid token returns 400."""
    r = await client.get("/api/v1/auth/verify-email?token=totally-invalid-token-xyz")
    assert r.status_code == 400


async def test_resend_verification_authenticated(client: AsyncClient):
    """POST /auth/resend-verification for unverified user returns 204."""
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/auth/resend-verification", headers=auth_headers(tokens))
    assert r.status_code == 204


async def test_user_name_default_null(client: AsyncClient):
    """Newly registered user has name=null."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["name"] is None


async def test_update_user_name(client: AsyncClient):
    """PATCH /users/me {name} saves and returns the name."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    r = await client.patch("/api/v1/users/me", json={"name": "Шура"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Шура"
    # Persisted on next GET
    r2 = await client.get("/api/v1/users/me", headers=headers)
    assert r2.json()["name"] == "Шура"


async def test_update_user_name_empty_clears_to_null(client: AsyncClient):
    """PATCH /users/me {name: ''} clears the name to null."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    await client.patch("/api/v1/users/me", json={"name": "Шура"}, headers=headers)
    r = await client.patch("/api/v1/users/me", json={"name": ""}, headers=headers)
    assert r.status_code == 200
    assert r.json()["name"] is None
