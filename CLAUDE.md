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

URLs: Frontend → http://localhost:5173 | API → http://localhost:8000 | Docs → http://localhost:8000/docs (dev only, disabled in production)

## Key architectural constraint: day-centric task model

**Day → tasks ← challenges** (NOT challenge → tasks)

`DailyTaskInstance` rows are generated via `daily_task_service.ensure_daily_tasks()` — always go through this function, never create tasks directly.

**When tasks are generated:**
1. `POST /challenges/start` — immediately generates tasks for the **entire challenge period** (past + future). If start_date is in the past, all past days are backfilled.
2. `GET /api/v1/daily/today` — lazy idempotent generation for that specific date (catches any missed days).
3. Celery beat at 00:05 UTC — nightly generation for all active challenges.

**Task visibility rules (applies everywhere — DailyTasks, Dashboard, Reports):**
- Active challenge + today/past → fully editable (Done / Skip / Undo)
- Future days → read-only (no action buttons, "Future · read only" badge) — Reports only
- Paused challenge → task visible but dimmed, "paused" badge, no action buttons — handled via `challenge_status`
- Cancelled challenge → task visible but dimmed, "cancelled" badge, no action buttons — handled via `challenge_status`
- Deleted challenge → all its `DailyTaskInstance` rows are hard-deleted

**Paused days are excluded from all statistics** (daily report, monthly report, challenge report, streak). The `pause_periods` JSON field on `ChallengeInstance` tracks historical pause intervals: `[{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD|null"}]`. Use `pause_utils.is_paused_on()` and `pause_utils.get_paused_dates()` — never inline this logic.

**`TaskCard` is the only component for rendering tasks** — use it everywhere tasks appear:
- `readOnly` prop: status badge instead of action buttons (Dashboard preview)
- Default (interactive): Done / Skip / Undo buttons
- `challenge_status === "cancelled"` or `"paused"` → dimmed, no buttons, status badge

Never create separate task row components (e.g. MiniTaskRow). All task display logic lives in `TaskCard`.

## Backend structure

```
backend/app/
  core/        config, database (async engine + session), security (JWT/bcrypt), redis, deps (auth middleware)
  models/      SQLAlchemy ORM (User, Challenge, ChallengeInstance, DailyTaskInstance, UserDevice, NotificationLog)
  schemas/     Pydantic request/response (auth, challenge, daily, reports, notifications, user)
  services/    Business logic — keep all logic here, endpoints are thin
    pause_utils.py  is_paused_on(), get_paused_dates() — shared pause logic, no circular imports
  api/v1/      FastAPI routers (auth, challenges, daily, reports, notifications, users)
  workers/     celery_app.py (beat schedule), tasks.py (sync wrappers calling async services)
```

All business logic lives in `services/`. Endpoints only validate input, call services, and map exceptions to HTTP errors.

## Frontend structure

```
frontend/src/
  components/    Layout, TaskCard, ProgressRing, Icons, PasswordInput, Onboarding, ConfirmModal
  pages/         Dashboard, DailyTasks, Challenges, CreateChallenge, ChallengeDetail,
                 ChallengeReport, Reports, Settings, Login, Register
  store/         authStore (user + tokens), taskStore (daily summary), themeStore (dark mode)
  services/      api.ts (Axios + JWT auto-refresh), push.ts (Web Push)
  utils/         category.ts (category detection from title), templateTranslations.ts
  i18n/locales/  en.ts, ru.ts
```

## Confirmation dialogs

**Never use `window.confirm()` or inline modal markup.** All confirmation dialogs must use `ConfirmModal` from `components/ConfirmModal.tsx`:

```tsx
import ConfirmModal from "../components/ConfirmModal";

// State
const [showModal, setShowModal] = useState(false);

// JSX
{showModal && (
  <ConfirmModal
    emoji="⚠️"
    title={t("...")}
    body={t("...")}
    confirmLabel={t("...")}
    cancelLabel={t("...")}
    confirmDanger={true}
    onConfirm={handleAction}
    onCancel={() => setShowModal(false)}
  />
)}
```

This ensures all confirmations share the same visual style. Redesigning `ConfirmModal` updates every confirmation in the app.

## API endpoints

```
POST /api/v1/auth/register/email
POST /api/v1/auth/login/email
POST /api/v1/auth/refresh
POST /api/v1/auth/logout                           # revokes refresh token in Redis

GET  /api/v1/users/me
PATCH /api/v1/users/me

GET  /api/v1/challenges/templates
POST /api/v1/challenges
POST /api/v1/challenges/start
GET  /api/v1/challenges/my
GET  /api/v1/challenges/instances/{id}
PATCH /api/v1/challenges/instances/{id}
DELETE /api/v1/challenges/instances/{id}          # soft cancel (API-only, no UI button)
POST /api/v1/challenges/instances/{id}/pause
POST /api/v1/challenges/instances/{id}/resume
DELETE /api/v1/challenges/instances/{id}/permanent  # hard delete — any status, deletes tasks too

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
- Logout: `POST /auth/logout` blacklists the refresh token in Redis (TTL = remaining token lifetime)
- Rate limits: register 5/min, login 10/min, refresh 20/min (per IP, via `slowapi`)
- `/docs` and `/redoc` disabled in production (`APP_ENV=production`)

## Database migrations

```bash
# Apply migrations (runs automatically on docker compose up)
docker exec challengetracker-backend-1 alembic upgrade head

# Create a new migration
docker exec challengetracker-backend-1 alembic revision --autogenerate -m "description"
```

Migrations: `0001_initial` → `0002_seed_templates` → `0003_update_templates` → `0004_add_templates` → `0005_add_pause_periods`

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
| Auto-complete expired challenges | 00:10 |
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
# Install test deps and run all 68 tests (local Docker only)
docker exec challengetracker-backend-1 pip install -r requirements-test.txt -q
docker exec challengetracker-backend-1 pytest tests/ -v --tb=short

# Run a single test
docker exec challengetracker-backend-1 pytest tests/test_auth.py::test_login_success -v
```

⚠️ **CRITICAL: NEVER run pytest on the production server.** Each test truncates ALL tables — this destroys all real user data. Tests must only run on a local Docker stack.

- Local `docker-compose.yml` sets `PYTEST_ALLOW=1` — tests run normally
- Production server does NOT have `PYTEST_ALLOW=1` — pytest is blocked at import time with a clear error
- `pytest` is also not installed in the production image (double protection)

Test files: `test_auth.py` (16) · `test_challenges.py` (11) · `test_daily.py` (11) · `test_reports.py` (8) · `test_new_features.py` (22)

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

## Security notes

- **Rate limiting**: `slowapi` on auth endpoints. In tests (`PYTEST_ALLOW=1`) each request gets a unique key so limits never trigger.
- **Token revocation**: logout blacklists refresh token in Redis. Access tokens are short-lived (30 min) and not blacklisted.
- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy` added via middleware.
- **Input validation**: `default_duration_days` 1–365, `tasks_per_day` 1–10, timezone validated against `pytz.all_timezones`.
- **Daily backups**: cron at 03:00 UTC dumps DB to `/opt/backups/db_YYYY-MM-DD.gz` (7-day retention) on the VPS.

## Known issues / gotchas

- **bcrypt compatibility**: `bcrypt` is pinned to `4.0.1` — `passlib 1.7.4` reads `bcrypt.__about__.__version__` removed in bcrypt 4.1+
- **Vite HMR on Windows + Docker**: file watching sometimes misses changes — hard-refresh with `Ctrl+Shift+R` or restart container
- **Port 5432**: not exposed to host. Backend connects via internal Docker network (`db:5432`)
- **Frontend date**: Dashboard and DailyTasks always pass `?target_date=YYYY-MM-DD` from the browser to avoid server timezone mismatch
