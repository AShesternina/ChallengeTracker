"""Tests for features added after initial release:
- POST /tasks/{id}/reset
- POST /challenges/instances/{id}/pause
- POST /challenges/instances/{id}/resume
- DELETE /challenges/instances/{id}/permanent
- GET /reports/streak
- sequence_number / total_count in DailyTaskOut
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

async def test_delete_cancelled_instance(client: AsyncClient):
    _, headers, instance = await _setup(client)
    await client.delete(f"/api/v1/challenges/instances/{instance['id']}", headers=headers)

    r = await client.delete(f"/api/v1/challenges/instances/{instance['id']}/permanent",
                            headers=headers)
    assert r.status_code == 204

    r = await client.get(f"/api/v1/challenges/instances/{instance['id']}", headers=headers)
    assert r.status_code == 404


async def test_delete_active_instance_fails(client: AsyncClient):
    _, headers, instance = await _setup(client)
    r = await client.delete(f"/api/v1/challenges/instances/{instance['id']}/permanent",
                            headers=headers)
    assert r.status_code == 400


async def test_delete_cleans_up_tasks(client: AsyncClient):
    _, headers, instance = await _setup(client)
    await client.get("/api/v1/daily/today", headers=headers)  # generate tasks
    await client.delete(f"/api/v1/challenges/instances/{instance['id']}", headers=headers)
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


async def test_streak_after_completion(client: AsyncClient):
    _, headers, _ = await _setup(client)
    task = await _get_first_task(client, headers)
    await client.post(f"/api/v1/tasks/{task['id']}/complete", headers=headers)

    r = await client.get("/api/v1/reports/streak", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["current_streak"] == 1
    assert data["longest_streak"] == 1


async def test_streak_reset_after_undo(client: AsyncClient):
    _, headers, _ = await _setup(client)
    task = await _get_first_task(client, headers)
    await client.post(f"/api/v1/tasks/{task['id']}/complete", headers=headers)
    await client.post(f"/api/v1/tasks/{task['id']}/reset", headers=headers)

    r = await client.get("/api/v1/reports/streak", headers=headers)
    assert r.json()["current_streak"] == 0


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


async def test_challenge_status_cancelled_in_tasks(client: AsyncClient):
    """Tasks of a cancelled challenge should report challenge_status='cancelled'."""
    _, headers, instance = await _setup(client)
    await client.get("/api/v1/daily/today", headers=headers)

    await client.delete(f"/api/v1/challenges/instances/{instance['id']}", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["tasks"][0]["challenge_status"] == "cancelled"


async def test_challenge_status_paused_in_tasks(client: AsyncClient):
    """Tasks of a paused challenge should report challenge_status='paused'."""
    _, headers, instance = await _setup(client)

    await client.post(f"/api/v1/challenges/instances/{instance['id']}/pause", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["tasks"][0]["challenge_status"] == "paused"


async def test_cancelled_tasks_still_appear_in_daily(client: AsyncClient):
    """Cancelled challenge tasks must still appear in /daily/today with challenge_status='cancelled'.
    Frontend uses this to render them as read-only. They must NOT disappear from the list."""
    _, headers, instance = await _setup(client)
    await client.get("/api/v1/daily/today", headers=headers)  # generate tasks

    await client.delete(f"/api/v1/challenges/instances/{instance['id']}", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    tasks = r.json()["tasks"]
    assert len(tasks) == 1
    assert tasks[0]["challenge_status"] == "cancelled"
    assert tasks[0]["status"] == "pending"  # original status preserved
