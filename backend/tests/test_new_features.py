"""Tests for features added after initial release:
- POST /tasks/{id}/reset
- POST /challenges/instances/{id}/pause + resume
- DELETE /challenges/instances/{id}/permanent (any status)
- GET /reports/streak
- sequence_number / total_count in DailyTaskOut
- challenge_status field in DailyTaskOut (active | paused | completed)
- pause_periods: paused tasks visible but excluded from counts and reports
"""
import pytest
from datetime import date
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

pytestmark = pytest.mark.asyncio

TODAY = date.today().isoformat()


# ── helpers ──────────────────────────────────────────────────────────────────

async def _setup(client: AsyncClient, title: str = "Test", type_: str = "single",
                 tasks_per_day: int = 1, task_times: list | None = None) -> tuple[dict, dict, dict]:
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    r = await client.post("/api/v1/challenges", json={
        "title": title,
        "type": type_,
        "default_duration_days": 7,
        "tasks_per_day": tasks_per_day,
        "task_times": task_times or ["08:00"],
    }, headers=headers)
    challenge_id = r.json()["id"]

    r = await client.post("/api/v1/challenges/start",
                          json={"challenge_id": challenge_id, "start_date": TODAY},
                          headers=headers)
    instance = r.json()
    return tokens, headers, instance


async def _get_first_task(client: AsyncClient, headers: dict) -> dict:
    r = await client.get("/api/v1/daily/today", headers=headers)
    return r.json()["tasks"][0]


# ── reset task ────────────────────────────────────────────────────────────────

async def test_reset_completed_task(client: AsyncClient):
    _, headers, _ = await _setup(client)
    task = await _get_first_task(client, headers)

    await client.post(f"/api/v1/tasks/{task['id']}/complete", headers=headers)
    r = await client.post(f"/api/v1/tasks/{task['id']}/reset", headers=headers)

    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "pending"
    assert data["completed_at"] is None


async def test_reset_skipped_task(client: AsyncClient):
    _, headers, _ = await _setup(client)
    task = await _get_first_task(client, headers)

    await client.post(f"/api/v1/tasks/{task['id']}/skip", headers=headers)
    r = await client.post(f"/api/v1/tasks/{task['id']}/reset", headers=headers)

    assert r.status_code == 200
    assert r.json()["status"] == "pending"


async def test_reset_task_not_found(client: AsyncClient):
    _, headers, _ = await _setup(client)
    r = await client.post("/api/v1/tasks/99999/reset", headers=headers)
    assert r.status_code == 404


async def test_reset_other_user_task(client: AsyncClient):
    _, headers1, _ = await _setup(client)
    task = await _get_first_task(client, headers1)

    tokens2 = await register_and_login(client, "other@example.com", "pass123")
    r = await client.post(f"/api/v1/tasks/{task['id']}/reset", headers=auth_headers(tokens2))
    assert r.status_code == 404


# ── pause / resume ────────────────────────────────────────────────────────────

async def test_pause_active_instance(client: AsyncClient):
    _, headers, instance = await _setup(client)
    r = await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "paused"


async def test_resume_paused_instance(client: AsyncClient):
    _, headers, instance = await _setup(client)
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)
    r = await client.post(f"/api/v1/challenges/instances/{instance['id']}/resume", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "active"


async def test_pause_already_paused(client: AsyncClient):
    _, headers, instance = await _setup(client)
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)
    r = await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)
    assert r.status_code == 400


async def test_resume_active_instance_fails(client: AsyncClient):
    _, headers, instance = await _setup(client)
    r = await client.post(f"/api/v1/challenges/instances/{instance['id']}/resume", headers=headers)
    assert r.status_code == 400


async def test_pause_other_user_instance(client: AsyncClient):
    _, headers1, instance = await _setup(client)
    tokens2 = await register_and_login(client, "other@example.com", "pass123")
    r = await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause",
                          headers=auth_headers(tokens2))
    assert r.status_code == 400


# ── permanent delete ──────────────────────────────────────────────────────────

async def test_delete_active_instance(client: AsyncClient):
    """Active challenges can be permanently deleted directly."""
    _, headers, instance = await _setup(client)
    r = await client.delete(f"/api/v1/challenges/instances/{instance['id']}/permanent",
                            headers=headers)
    assert r.status_code == 204


async def test_delete_cleans_up_tasks(client: AsyncClient):
    """Permanent delete must remove all DailyTaskInstance rows for the challenge."""
    _, headers, instance = await _setup(client)
    await client.get("/api/v1/daily/today", headers=headers)  # generate tasks
    await client.delete(f"/api/v1/challenges/instances/{instance['id']}/permanent",
                        headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["total"] == 0


# ── streak report ─────────────────────────────────────────────────────────────

async def test_streak_no_tasks(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/reports/streak", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0
    assert data["grace_day_used"] is False


async def test_streak_after_completion(client: AsyncClient):
    _, headers, _ = await _setup(client)
    task = await _get_first_task(client, headers)
    await client.post(f"/api/v1/tasks/{task['id']}/complete", headers=headers)

    r = await client.get("/api/v1/reports/streak", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["current_streak"] == 1
    assert data["longest_streak"] == 1
    assert data["grace_day_used"] is False


async def test_streak_reset_after_undo(client: AsyncClient):
    _, headers, _ = await _setup(client)
    task = await _get_first_task(client, headers)
    await client.post(f"/api/v1/tasks/{task['id']}/complete", headers=headers)
    await client.post(f"/api/v1/tasks/{task['id']}/reset", headers=headers)

    r = await client.get("/api/v1/reports/streak", headers=headers)
    data = r.json()
    assert data["current_streak"] == 0
    assert data["grace_day_used"] is False


async def test_streak_protection_default_true(client: AsyncClient):
    """New user has streak_protection=True, reflected in /users/me."""
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/users/me", headers=auth_headers(tokens))
    assert r.json()["streak_protection"] is True


async def test_streak_protection_disable_persists(client: AsyncClient):
    """Disabling streak_protection persists and affects subsequent /users/me."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    r = await client.patch("/api/v1/users/me", json={"streak_protection": False}, headers=headers)
    assert r.status_code == 200
    assert r.json()["streak_protection"] is False
    r2 = await client.get("/api/v1/users/me", headers=headers)
    assert r2.json()["streak_protection"] is False


# ── sequence_number / total_count in multi-task challenges ────────────────────

async def test_multi_task_sequence_numbers(client: AsyncClient):
    _, headers, _ = await _setup(
        client, title="Water", type_="multi", tasks_per_day=3,
        task_times=["09:00", "13:00", "18:00"]
    )
    r = await client.get("/api/v1/daily/today", headers=headers)
    tasks = r.json()["tasks"]

    assert len(tasks) == 3
    seq_numbers = [t["sequence_number"] for t in tasks]
    assert seq_numbers == [1, 2, 3]
    for t in tasks:
        assert t["total_count"] == 3


async def test_single_task_no_sequence(client: AsyncClient):
    _, headers, _ = await _setup(client, title="Workout", type_="single", tasks_per_day=1)
    r = await client.get("/api/v1/daily/today", headers=headers)
    task = r.json()["tasks"][0]
    assert task["sequence_number"] is None
    assert task["total_count"] is None


# ── challenge_status field in DailyTaskOut ────────────────────────────────────

async def test_challenge_status_active_in_tasks(client: AsyncClient):
    """Active challenge tasks should have challenge_status='active'."""
    _, headers, _ = await _setup(client)
    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["tasks"][0]["challenge_status"] == "active"


async def test_challenge_status_paused_in_tasks(client: AsyncClient):
    """Tasks of a paused challenge should report challenge_status='paused'."""
    _, headers, instance = await _setup(client)

    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["tasks"][0]["challenge_status"] == "paused"


# ── pause periods affect daily summary and reports ────────────────────────────

async def test_paused_tasks_visible_but_not_counted_in_daily(client: AsyncClient):
    """Tasks of a paused challenge appear in /daily/today but are excluded from total/completed/pending."""
    _, headers, instance = await _setup(client)
    await client.get("/api/v1/daily/today", headers=headers)  # ensure tasks exist
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    data = r.json()
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["challenge_status"] == "paused"
    assert data["total"] == 0
    assert data["completed"] == 0
    assert data["pending"] == 0


async def test_daily_report_excludes_paused_days(client: AsyncClient):
    """Daily report must not count tasks from paused challenges."""
    _, headers, instance = await _setup(client)
    await client.get("/api/v1/daily/today", headers=headers)
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)

    r = await client.get(f"/api/v1/reports/daily/{TODAY}", headers=headers)
    data = r.json()
    assert data["total"] == 0
    assert data["completed"] == 0


async def test_paused_tasks_counted_after_resume(client: AsyncClient):
    """After resuming, tasks are counted again in the daily summary."""
    _, headers, instance = await _setup(client)
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/resume", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    data = r.json()
    assert data["total"] == 1
    assert data["tasks"][0]["challenge_status"] == "active"


async def test_hard_delete_paused_instance(client: AsyncClient):
    """Permanently deleting a paused instance should succeed without requiring cancellation first."""
    _, headers, instance = await _setup(client)
    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)
    r = await client.delete(f"/api/v1/challenges/instances/{instance['id']}/permanent", headers=headers)
    assert r.status_code == 204
    r = await client.get(f"/api/v1/challenges/instances/{instance['id']}", headers=headers)
    assert r.status_code == 404
