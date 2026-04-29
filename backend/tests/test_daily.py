import pytest
from datetime import date
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

pytestmark = pytest.mark.asyncio

TODAY = date.today().isoformat()


async def _setup_challenge(client: AsyncClient) -> tuple[dict, dict]:
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    r = await client.post("/api/v1/challenges", json={
        "title": "Daily Push-ups",
        "type": "single",
        "default_duration_days": 7,
        "tasks_per_day": 1,
        "task_times": ["07:00"],
    }, headers=headers)
    challenge_id = r.json()["id"]

    await client.post("/api/v1/challenges/start", json={
        "challenge_id": challenge_id,
        "start_date": TODAY,
    }, headers=headers)

    return tokens, headers


async def test_get_today_no_challenges(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/daily/today", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["tasks"] == []


async def test_get_today_creates_tasks(client: AsyncClient):
    _, headers = await _setup_challenge(client)
    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["completed"] == 0
    assert data["pending"] == 1
    task = data["tasks"][0]
    assert task["status"] == "pending"
    assert task["challenge_title"] == "Daily Push-ups"


async def test_get_today_idempotent(client: AsyncClient):
    """Multiple calls should not duplicate tasks."""
    _, headers = await _setup_challenge(client)
    await client.get("/api/v1/daily/today", headers=headers)
    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["total"] == 1


async def test_complete_task(client: AsyncClient):
    _, headers = await _setup_challenge(client)
    r = await client.get("/api/v1/daily/today", headers=headers)
    task_id = r.json()["tasks"][0]["id"]

    r = await client.post(f"/api/v1/tasks/{task_id}/complete", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "completed"
    assert r.json()["completed_at"] is not None


async def test_skip_task(client: AsyncClient):
    _, headers = await _setup_challenge(client)
    r = await client.get("/api/v1/daily/today", headers=headers)
    task_id = r.json()["tasks"][0]["id"]

    r = await client.post(f"/api/v1/tasks/{task_id}/skip", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "skipped"


async def test_complete_task_updates_summary(client: AsyncClient):
    _, headers = await _setup_challenge(client)
    r = await client.get("/api/v1/daily/today", headers=headers)
    task_id = r.json()["tasks"][0]["id"]
    await client.post(f"/api/v1/tasks/{task_id}/complete", headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    data = r.json()
    assert data["completed"] == 1
    assert data["pending"] == 0


async def test_complete_task_not_found(client: AsyncClient):
    _, headers = await _setup_challenge(client)
    r = await client.post("/api/v1/tasks/99999/complete", headers=headers)
    assert r.status_code == 404


async def test_complete_other_user_task(client: AsyncClient):
    tokens1, headers1 = await _setup_challenge(client)
    r = await client.get("/api/v1/daily/today", headers=headers1)
    task_id = r.json()["tasks"][0]["id"]

    tokens2 = await register_and_login(client, "other@example.com", "otherpass")
    r = await client.post(f"/api/v1/tasks/{task_id}/complete", headers=auth_headers(tokens2))
    assert r.status_code == 404


async def test_multi_task_challenge(client: AsyncClient):
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    r = await client.post("/api/v1/challenges", json={
        "title": "Water",
        "type": "multi",
        "default_duration_days": 7,
        "tasks_per_day": 3,
        "task_times": ["09:00", "13:00", "18:00"],
    }, headers=headers)
    cid = r.json()["id"]
    await client.post("/api/v1/challenges/start", json={"challenge_id": cid, "start_date": TODAY}, headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    assert r.json()["total"] == 3
