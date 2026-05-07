import pytest
from datetime import date, timedelta
from httpx import AsyncClient

from tests.conftest import auth_headers, register_and_login

pytestmark = pytest.mark.asyncio

TODAY = date.today().isoformat()
NEXT_MONTH = (date.today() + timedelta(days=30)).isoformat()


async def _create_and_start(client: AsyncClient, headers: dict, title: str = "Test Challenge") -> dict:
    r = await client.post("/api/v1/challenges", json={
        "title": title,
        "type": "single",
        "default_duration_days": 7,
        "tasks_per_day": 1,
        "task_times": ["08:00"],
    }, headers=headers)
    assert r.status_code == 201
    challenge_id = r.json()["id"]

    r = await client.post("/api/v1/challenges/start", json={
        "challenge_id": challenge_id,
        "start_date": TODAY,
    }, headers=headers)
    assert r.status_code == 201
    return r.json()


async def test_get_templates(client: AsyncClient):
    r = await client.get("/api/v1/challenges/templates")
    assert r.status_code == 200
    templates = r.json()
    assert len(templates) >= 1
    assert "title" in templates[0]
    assert "type" in templates[0]


async def test_create_challenge(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/challenges", json={
        "title": "Morning Run",
        "description": "Run every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": ["07:00"],
    }, headers=auth_headers(tokens))
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Morning Run"
    assert data["type"] == "single"


async def test_start_challenge(client: AsyncClient):
    tokens = await register_and_login(client)
    instance = await _create_and_start(client, auth_headers(tokens))
    assert instance["status"] == "active"
    assert instance["start_date"] == TODAY


async def test_start_challenge_not_found(client: AsyncClient):
    tokens = await register_and_login(client)
    r = await client.post("/api/v1/challenges/start", json={
        "challenge_id": 99999,
        "start_date": TODAY,
    }, headers=auth_headers(tokens))
    assert r.status_code == 404


async def test_list_my_challenges(client: AsyncClient):
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    await _create_and_start(client, headers, "Challenge A")
    await _create_and_start(client, headers, "Challenge B")

    r = await client.get("/api/v1/challenges/my", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


async def test_get_instance_detail(client: AsyncClient):
    tokens = await register_and_login(client)
    instance = await _create_and_start(client, auth_headers(tokens))
    instance_id = instance["id"]

    r = await client.get(f"/api/v1/challenges/instances/{instance_id}", headers=auth_headers(tokens))
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == instance_id
    assert data["challenge"]["title"] == "Test Challenge"


async def test_get_instance_other_user(client: AsyncClient):
    tokens1 = await register_and_login(client, "user1@example.com")
    tokens2 = await register_and_login(client, "user2@example.com", "pass2222")
    instance = await _create_and_start(client, auth_headers(tokens1))

    r = await client.get(
        f"/api/v1/challenges/instances/{instance['id']}",
        headers=auth_headers(tokens2)
    )
    assert r.status_code == 404


async def test_update_instance(client: AsyncClient):
    tokens = await register_and_login(client)
    instance = await _create_and_start(client, auth_headers(tokens))

    r = await client.patch(
        f"/api/v1/challenges/instances/{instance['id']}",
        json={"title": "Updated Title", "tasks_per_day": 2, "task_times": ["07:00", "20:00"]},
        headers=auth_headers(tokens),
    )
    assert r.status_code == 200
    data = r.json()
    assert data["challenge"]["title"] == "Updated Title"
    assert data["challenge"]["tasks_per_day"] == 2


async def test_start_challenge_past_date_backfills_tasks(client: AsyncClient):
    """Starting with a past date should create tasks for past days (backfill)."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    past_date = (date.today() - timedelta(days=2)).isoformat()

    r = await client.post("/api/v1/challenges", json={
        "title": "Backfill Test",
        "type": "single",
        "default_duration_days": 7,
        "tasks_per_day": 1,
        "task_times": ["08:00"],
    }, headers=headers)
    cid = r.json()["id"]
    r = await client.post("/api/v1/challenges/start", json={
        "challenge_id": cid, "start_date": past_date,
    }, headers=headers)
    assert r.status_code == 201

    r = await client.get(f"/api/v1/reports/daily/{past_date}", headers=headers)
    assert r.status_code == 200
    assert r.json()["total"] == 1


async def test_update_instance_period_regenerates_tasks(client: AsyncClient):
    """Extending end_date should regenerate tasks for the new period."""
    tokens = await register_and_login(client)
    headers = auth_headers(tokens)
    instance = await _create_and_start(client, headers)

    old_end = date.fromisoformat(instance["end_date"])
    new_end = (old_end + timedelta(days=3)).isoformat()

    r = await client.patch(
        f"/api/v1/challenges/instances/{instance['id']}",
        json={"end_date": new_end},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["end_date"] == new_end

    r = await client.get(f"/api/v1/reports/daily/{new_end}", headers=headers)
    assert r.json()["total"] == 1


async def test_update_instance_type_change(client: AsyncClient):
    """Changing challenge type should be accepted and reflected in the response."""
    tokens = await register_and_login(client)
    instance = await _create_and_start(client, auth_headers(tokens))

    r = await client.patch(
        f"/api/v1/challenges/instances/{instance['id']}",
        json={"type": "all_day", "task_times": None, "tasks_per_day": 1},
        headers=auth_headers(tokens),
    )
    assert r.status_code == 200
    assert r.json()["challenge"]["type"] == "all_day"
