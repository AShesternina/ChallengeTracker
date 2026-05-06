import pytest
from datetime import date
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

pytestmark = pytest.mark.asyncio

TODAY = date.today().isoformat()
YEAR = date.today().year
MONTH = date.today().month


async def _setup_with_completed_task(client: AsyncClient) -> tuple[dict, int]:
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    r = await client.post("/api/v1/challenges", json={
        "title": "Report Test",
        "type": "single",
        "default_duration_days": 7,
        "tasks_per_day": 1,
        "task_times": ["08:00"],
    }, headers=headers)
    cid = r.json()["id"]

    r = await client.post("/api/v1/challenges/start", json={
        "challenge_id": cid, "start_date": TODAY,
    }, headers=headers)
    instance_id = r.json()["id"]

    r = await client.get("/api/v1/daily/today", headers=headers)
    task_id = r.json()["tasks"][0]["id"]
    await client.post(f"/api/v1/tasks/{task_id}/complete", headers=headers)

    return tokens, instance_id


async def test_daily_report(client: AsyncClient):
    tokens, _ = await _setup_with_completed_task(client)
    r = await client.get(f"/api/v1/reports/daily/{TODAY}", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["completed"] == 1
    assert data["completion_rate"] == 1.0


async def test_daily_report_no_tasks(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get(f"/api/v1/reports/daily/{TODAY}", headers=auth_headers(tokens))
    assert r.status_code == 200
    assert r.json()["total"] == 0
    assert r.json()["completion_rate"] == 0.0


async def test_monthly_report(client: AsyncClient):
    tokens, _ = await _setup_with_completed_task(client)
    r = await client.get(f"/api/v1/reports/monthly/{YEAR}/{MONTH}", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["year"] == YEAR
    assert data["month"] == MONTH
    assert data["total_completed"] == 1
    assert len(data["days"]) > 0


async def test_monthly_report_invalid_month(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get(f"/api/v1/reports/monthly/{YEAR}/13", headers=auth_headers(tokens))
    assert r.status_code == 400


async def test_challenge_report(client: AsyncClient):
    tokens, instance_id = await _setup_with_completed_task(client)
    r = await client.get(f"/api/v1/reports/challenge/{instance_id}", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["challenge_title"] == "Report Test"
    assert data["completed_tasks"] == 1
    assert data["total_tasks"] == 1
    assert data["completion_rate"] == 1.0
    assert data["current_streak"] == 1
    assert data["longest_streak"] == 1


async def test_challenge_report_not_found(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.get("/api/v1/reports/challenge/99999", headers=auth_headers(tokens))
    assert r.status_code == 404


async def test_challenge_report_other_user(client: AsyncClient):
    tokens1, instance_id = await _setup_with_completed_task(client)
    tokens2 = await register_and_login(client, "other@example.com", "pass9999")
    r = await client.get(f"/api/v1/reports/challenge/{instance_id}", headers=auth_headers(tokens2))
    assert r.status_code == 404


async def test_daily_report_partial_completion(client: AsyncClient):
    """Daily report with 1 completed and 1 skipped task should have completion_rate=0.5."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)

    r = await client.post("/api/v1/challenges", json={
        "title": "Mixed Status",
        "type": "multi",
        "default_duration_days": 7,
        "tasks_per_day": 2,
        "task_times": ["08:00", "20:00"],
    }, headers=headers)
    cid = r.json()["id"]
    await client.post("/api/v1/challenges/start", json={"challenge_id": cid, "start_date": TODAY}, headers=headers)

    r = await client.get("/api/v1/daily/today", headers=headers)
    tasks = r.json()["tasks"]
    await client.post(f"/api/v1/tasks/{tasks[0]['id']}/complete", headers=headers)
    await client.post(f"/api/v1/tasks/{tasks[1]['id']}/skip", headers=headers)

    r = await client.get(f"/api/v1/reports/daily/{TODAY}", headers=headers)
    data = r.json()
    assert data["total"] == 2
    assert data["completed"] == 1
    assert data["completion_rate"] == 0.5
