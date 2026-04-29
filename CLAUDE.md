# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 async, Alembic, Celery |
| Database | PostgreSQL 16 |
| Queue / Cache | Redis 7 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3, PWA (vite-plugin-pwa) |
| i18n | i18next + react-i18next (EN/RU, stored in `ct_language` localStorage key) |
| Notifications | Web Push (pywebpush) + SendGrid email fallback (mock when key absent) |

## Running the project

```bash
# Full stack (first run or after dependency changes)
docker compose up --build

# Rebuild only one service
docker compose up --build backend
docker compose up --build frontend

# After changing backend code (hot-reload is on, usually no restart needed)
# After adding npm packages — restart frontend container:
docker restart challengetracker-frontend-1

# Install new npm packages into the running container
docker exec challengetracker-frontend-1 npm install <package>
```

URLs: Frontend → http://localhost:5173 | API → http://localhost:8000 | Docs → http://localhost:8000/docs

## Key architectural constraint: day-centric task model

**Day → tasks ← challenges** (NOT challenge → tasks)

`DailyTaskInstance` rows are generated lazily on `GET /api/v1/daily/today` (idempotent) and also nightly by Celery beat at 00:05 UTC. Never create tasks directly from challenge logic — always go through `daily_task_service.ensure_daily_tasks()`.

## Backend structure

```
backend/app/
  core/        config, database (async engine + session), security (JWT/bcrypt), redis, deps (auth middleware)
  models/      SQLAlchemy ORM (User, Challenge, ChallengeInstance, DailyTaskInstance, UserDevice, NotificationLog)
  schemas/     Pydantic request/response (auth, challenge, daily, reports, notifications, user)
  services/    Business logic — keep all logic here, endpoints are thin
  api/v1/      FastAPI routers (auth, challenges, daily, reports, notifications, users)
  workers/     celery_app.py (beat schedule), tasks.py (sync wrappers calling async services)
```

All business logic lives in `services/`. Endpoints only validate input, call services, and map exceptions to HTTP errors.

## Database migrations

```bash
# Apply migrations (runs automatically on docker compose up)
docker exec challengetracker-backend-1 alembic upgrade head

# Create a new migration (run from /backend inside container)
docker exec challengetracker-backend-1 alembic revision --autogenerate -m "description"
```

Migrations are in `backend/alembic/versions/`. PostgreSQL enums (e.g. `challengetype`) require explicit `CAST(:value AS enumtype)` when inserting via `op.get_bind().execute(sa.text(...))` — do NOT use `op.bulk_insert()` with enum columns.

## Notification dispatch

`notification_service.dispatch()` — push-first, email fallback:
1. If user has registered push devices → send Web Push
2. Otherwise → send email via `email_adapter` (SendGrid or mock)

Never hardcode notification text in the backend. All copy lives in frontend translations.

## Frontend structure

```
frontend/src/
  i18n/          i18next setup + locales/en.ts + locales/ru.ts
  pages/         One file per route (Dashboard, DailyTasks, Challenges, CreateChallenge, Reports, ChallengeReport, Settings, Login, Register)
  components/    Layout (nav), TaskCard, ProgressRing
  services/      api.ts (Axios instance with JWT auto-refresh), push.ts (Web Push subscribe)
  store/         Zustand: authStore (user + tokens), taskStore (daily summary)
```

## Adding translations

Add keys to both `frontend/src/i18n/locales/en.ts` and `frontend/src/i18n/locales/ru.ts`, then use `const { t } = useTranslation()` and `t("section.key")` in components. Language preference is persisted in localStorage under `ct_language`.

## Auth flow

- Email: `POST /auth/register/email` or `/auth/login/email` → JWT pair
- Phone: `POST /auth/register/phone` (returns OTP in dev) → `POST /auth/verify/otp` → JWT pair
- Tokens stored in localStorage; Axios interceptor auto-refreshes on 401 using the refresh token

## Celery beat schedule (UTC)

| Task | Time |
|------|------|
| Generate daily tasks for all users | 00:05 |
| Morning summary notification | 08:00 |
| Daily report notification | 21:00 |

## Environment

Copy `backend/.env.example` → `backend/.env`. Key variables:
- `SECRET_KEY` — change in production
- `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` — leave empty to use mock push (logs to console)
- `SENDGRID_API_KEY` — leave empty to use mock email (logs to console)

## Running tests

```bash
# Install test deps and run all 36 tests with coverage (inside running local container)
docker exec challengetracker-backend-1 bash -c \
  "pip install -r requirements-test.txt -q && pytest tests/ -v --tb=short --cov=app --cov-report=term-missing"

# Run a single test
docker exec challengetracker-backend-1 pytest tests/test_auth.py::test_login_success -v
```

Tests use the **same PostgreSQL database** as the running app. Each test truncates all tables and reseeds `challenge_templates` before running — fully isolated. Run only on the **local Docker stack**, never on production.

Coverage summary (last run): **66% overall** — services and workers have lower coverage; auth/models/schemas are well covered.

## Known issues / gotchas

- **bcrypt compatibility**: `bcrypt` is pinned to `4.0.1` because `passlib 1.7.4` reads `bcrypt.__about__.__version__` which was removed in bcrypt 4.1+
- **Vite HMR on Windows + Docker**: file watching sometimes misses changes. Hard-refresh with `Ctrl+Shift+R` or `docker restart challengetracker-frontend-1`
- **Port 5432**: not exposed to host (conflicts with other local Postgres). Backend connects via internal Docker network (`db:5432`)
