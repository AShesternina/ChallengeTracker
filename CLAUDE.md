# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 async, Alembic, Celery |
| Database | PostgreSQL 16 |
| Queue / Cache | Redis 7 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3, PWA (vite-plugin-pwa) |
| i18n | i18next + react-i18next (EN/RU, `ct_language` localStorage key) |
| Notifications | Web Push (pywebpush) + SendGrid email fallback (mock when key absent) |

## Running the project

```bash
# Full stack (first run or after dependency changes)
docker compose up --build

# Rebuild only one service
docker compose up --build backend
docker compose up --build frontend

# After adding npm packages — restart frontend container:
docker restart challengetracker-frontend-1

# Install new npm packages into the running container
docker exec challengetracker-frontend-1 npm install <package>
```

URLs: Frontend → http://localhost:5173 | API → http://localhost:8000 | Docs → http://localhost:8000/docs

## Key architectural constraint: day-centric task model

**Day → tasks ← challenges** (NOT challenge → tasks)

`DailyTaskInstance` rows are generated via `daily_task_service.ensure_daily_tasks()` — always go through this function, never create tasks directly.

**When tasks are generated:**
1. `POST /challenges/start` — immediately generates tasks for the **entire challenge period** (past + future). If start_date is in the past, all past days are backfilled.
2. `GET /api/v1/daily/today` — lazy idempotent generation for that specific date (catches any missed days).
3. Celery beat at 00:05 UTC — nightly generation for all active challenges.

**Task visibility rules (in Reports heatmap day detail):**
- Past days / today + active challenge → fully editable (Done / Skip / Undo)
- Future days → read-only (no action buttons, "Future · read only" badge)
- Cancelled challenge tasks → read-only, dimmed, "cancelled" label
- Deleted challenge → all its `DailyTaskInstance` rows are hard-deleted

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

## Frontend structure

```
frontend/src/
  components/    Layout, TaskCard, ProgressRing, Icons, PasswordInput, Onboarding
  pages/         Dashboard, DailyTasks, Challenges, CreateChallenge, ChallengeDetail,
                 ChallengeReport, Reports, Settings, Login, Register
  store/         authStore (user + tokens), taskStore (daily summary), themeStore (dark mode)
  services/      api.ts (Axios + JWT auto-refresh), push.ts (Web Push)
  utils/         category.ts (category detection from title), templateTranslations.ts
  i18n/locales/  en.ts, ru.ts
```

## API endpoints

```
POST /api/v1/auth/register/email
POST /api/v1/auth/login/email
POST /api/v1/auth/refresh

GET  /api/v1/users/me
PATCH /api/v1/users/me

GET  /api/v1/challenges/templates
POST /api/v1/challenges
POST /api/v1/challenges/start
GET  /api/v1/challenges/my
GET  /api/v1/challenges/instances/{id}
PATCH /api/v1/challenges/instances/{id}
DELETE /api/v1/challenges/instances/{id}          # cancel (soft)
POST /api/v1/challenges/instances/{id}/pause
POST /api/v1/challenges/instances/{id}/resume
DELETE /api/v1/challenges/instances/{id}/permanent  # hard delete (cancelled only)

GET  /api/v1/daily/today
POST /api/v1/tasks/{id}/complete
POST /api/v1/tasks/{id}/skip
POST /api/v1/tasks/{id}/reset                     # revert to pending

GET  /api/v1/reports/streak
GET  /api/v1/reports/daily/{date}
GET  /api/v1/reports/monthly/{year}/{month}
GET  /api/v1/reports/challenge/{instance_id}

GET  /api/v1/notifications/vapid-public-key
POST /api/v1/notifications/subscribe
GET  /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{id}
```

## Auth flow

- Email only: `POST /auth/register/email` or `/auth/login/email` → JWT pair
- Tokens stored in localStorage; Axios interceptor auto-refreshes on 401 using the refresh token

## Database migrations

```bash
# Apply migrations (runs automatically on docker compose up)
docker exec challengetracker-backend-1 alembic upgrade head

# Create a new migration
docker exec challengetracker-backend-1 alembic revision --autogenerate -m "description"
```

Migrations: `0001_initial` → `0002_seed_templates` → `0003_update_templates` → `0004_add_templates`

PostgreSQL enums require explicit `CAST(:value AS enumtype)` — do NOT use `op.bulk_insert()` with enum columns.

## DailyTaskOut schema

Key fields in `schemas/daily.py`:
- `sequence_number` / `total_count` — position among sibling tasks for multi-type challenges (null for single/all_day)
- `challenge_status` — status of the parent ChallengeInstance (`active | paused | completed | cancelled`). Used by frontend to determine editability.

## Category system (frontend)

`utils/category.ts` detects category from challenge title keywords and returns icon + colors.
Categories: `workout | water | reading | meditation | nosugar | sleep | productivity | mental | default`
Each has unique accent color and icon used across cards, progress bars, badges.

Template name/description translations live in `utils/templateTranslations.ts`.

## Notification dispatch

`notification_service.dispatch()` — push-first, email fallback:
1. Registered push devices → Web Push
2. Otherwise → email via `email_adapter` (SendGrid or mock)

Never hardcode notification text in the backend. All copy lives in frontend translations.

## Adding translations

Add keys to both `frontend/src/i18n/locales/en.ts` and `frontend/src/i18n/locales/ru.ts`.
Use `const { t } = useTranslation()` and `t("section.key")`. Never use inline `i18n.language === "ru" ? ... : ...` — always use `t()`.

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
- `CORS_ORIGINS` — JSON list of allowed origins

## Running tests

```bash
# Install test deps and run all 62 tests (inside running local container)
docker exec challengetracker-backend-1 pip install -r requirements-test.txt -q
docker exec challengetracker-backend-1 pytest tests/ -v --tb=short

# Run a single test
docker exec challengetracker-backend-1 pytest tests/test_auth.py::test_login_success -v
```

Tests use the **same PostgreSQL database** as the running app. Each test truncates all tables and reseeds 16 challenge templates. Run only on the **local Docker stack**, never on production.

**Important**: when running tests on the server (no local Docker), copy updated test files into the running container first:
```bash
docker cp backend/tests/<file>.py challengetracker-backend-1:/app/tests/<file>.py
```

Test files: `test_auth.py` (11) · `test_challenges.py` (12) · `test_daily.py` (11) · `test_reports.py` (8) · `test_new_features.py` (20)

## Deployment (production)

- **Frontend**: Vercel, auto-deploys from master → tracker.shura.pro
- **Backend**: VPS 195.133.194.173, docker-compose.prod.yml
- **SSL**: Let's Encrypt via certbot + nginx for api.tracker.shura.pro
- **DNS**: Porkbun — tracker.shura.pro → Vercel, api.tracker.shura.pro → 195.133.194.173

```bash
# Deploy to production
ssh root@195.133.194.173
cd /opt/challengetracker && git pull && docker compose -f docker-compose.prod.yml up --build -d
docker exec challengetracker-backend-1 alembic upgrade head
```

## Known issues / gotchas

- **bcrypt compatibility**: `bcrypt` is pinned to `4.0.1` — `passlib 1.7.4` reads `bcrypt.__about__.__version__` removed in bcrypt 4.1+
- **Vite HMR on Windows + Docker**: file watching sometimes misses changes — hard-refresh with `Ctrl+Shift+R` or restart container
- **Port 5432**: not exposed to host. Backend connects via internal Docker network (`db:5432`)
- **Tests on prod DB**: running pytest on production will truncate challenge_templates and reseed 16 templates — this is expected but wipes user data
