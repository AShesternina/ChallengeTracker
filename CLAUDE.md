# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 async, Alembic, Celery |
| Database | PostgreSQL 16 |
| Queue / Cache | Redis 7 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3, PWA (vite-plugin-pwa) |
| i18n | i18next + react-i18next (EN/RU/ES/PT, language stored in `User.language`) |
| Notifications | Web Push (data-only, SW translates) + Telegram Bot; SendGrid email fallback |

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
- Deleted challenge → all its `DailyTaskInstance` rows are hard-deleted

**Paused days are excluded from all statistics** (daily report, monthly report, challenge report, streak). The `pause_periods` JSON field on `ChallengeInstance` tracks historical pause intervals: `[{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD|null"}]`. Use `pause_utils.is_paused_on()` and `pause_utils.get_paused_dates()` — never inline this logic.

**`TaskCard` is the only component for rendering tasks** — use it everywhere tasks appear:
- `readOnly` prop: status badge instead of action buttons (Dashboard preview)
- Default (interactive): Done / Skip / Undo buttons
- `challenge_status === "paused"` → dimmed, no buttons, status badge

Never create separate task row components (e.g. MiniTaskRow). All task display logic lives in `TaskCard`.

## Backend structure

```
backend/app/
  core/        config, database (async engine + session), security (JWT/bcrypt), redis, deps (auth middleware)
  models/      SQLAlchemy ORM (User, Challenge, ChallengeInstance, DailyTaskInstance, UserDevice, NotificationLog)
  schemas/     Pydantic request/response (auth, challenge, daily, reports, notifications, user)
  services/    Business logic — keep all logic here, endpoints are thin
    pause_utils.py        is_paused_on(), get_paused_dates() — shared pause logic, no circular imports
    language_service.py   detect_language(request) — IP geo + Accept-Language fallback
    notifications_i18n.py translated strings for email fallback (EN/RU/ES/PT)
    telegram_service.py   send_telegram(chat_id, text) via Bot API (httpx); mock if token not set
  api/v1/      FastAPI routers (auth, challenges, daily, reports, notifications, users, telegram)
  workers/     celery_app.py (beat schedule), tasks.py (sync wrappers calling async services)
```

All business logic lives in `services/`. Endpoints only validate input, call services, and map exceptions to HTTP errors.

## Frontend structure

```
frontend/src/
  components/    Layout, TaskCard, ProgressRing, Icons, PasswordInput, ConfirmModal
  pages/         Dashboard, DailyTasks, Challenges, CreateChallenge, ChallengeDetail,
                 ChallengeReport, Reports, Settings, Login, Register, Onboarding
  components/    Layout, TaskCard, ProgressRing, Icons, PasswordInput, ConfirmModal, InstallBanner
  pages/         Dashboard, DailyTasks, Challenges, CreateChallenge, ChallengeDetail,
                 ChallengeReport, Reports, Settings, Login, Register, Onboarding, PublicChallenge
  store/         authStore (user + tokens + language + onboarding_completed + notification prefs + streak_protection + telegram_chat_id), taskStore, themeStore, installStore
  services/      api.ts (Axios + JWT auto-refresh), push.ts (Web Push, returns device ID), sw-lang.ts (SW language sync), telegramApi
  utils/         category.ts (category detection from title), templateTranslations.ts (16 templates × 4 langs + SLUG_TO_TITLE map)
  i18n/locales/  en.ts, ru.ts, es.ts, pt.ts
  sw.ts          Service Worker: precache + push handler (data-only, translates via IndexedDB) + message handler
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
PATCH /api/v1/users/me                              # accepts timezone, language, onboarding_completed, notification_morning_time, notification_evening_time, notify_task_reminders, streak_protection
DELETE /api/v1/users/me                             # hard delete user + all data (cascades)
POST /api/v1/users/me/telegram/generate-code        # generates one-time linking code, returns {code, bot_url}
DELETE /api/v1/users/me/telegram                    # unlink Telegram account
POST /api/v1/telegram/webhook                       # Telegram Bot webhook (receives /start <code>)

GET  /api/v1/challenges/templates
GET  /api/v1/challenges/templates/{slug}    # public — no auth required
POST /api/v1/challenges
POST /api/v1/challenges/start
GET  /api/v1/challenges/my
GET  /api/v1/challenges/instances/{id}
PATCH /api/v1/challenges/instances/{id}
POST /api/v1/challenges/instances/{id}/pause
POST /api/v1/challenges/instances/{id}/resume
DELETE /api/v1/challenges/instances/{id}/permanent  # hard delete — any status, deletes tasks too

GET  /api/v1/daily/today
POST /api/v1/tasks/{id}/complete
POST /api/v1/tasks/{id}/skip
POST /api/v1/tasks/{id}/reset                     # revert to pending

GET  /api/v1/reports/streak                    # returns {current_streak, longest_streak, grace_day_used}
GET  /api/v1/reports/momentum                  # 14-day weighted completion, trend
GET  /api/v1/reports/weekday-patterns          # completion rate Mon–Sun across all history
GET  /api/v1/reports/daily/{date}
GET  /api/v1/reports/monthly/{year}/{month}
GET  /api/v1/reports/challenge/{instance_id}   # includes recovery analytics fields

GET  /api/v1/notifications/vapid-public-key
POST /api/v1/notifications/subscribe
GET  /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{id}
```

## Onboarding flow

New users are redirected to `/onboarding` after registration (and on login if `onboarding_completed=false`).

- `User.onboarding_completed` (bool, default `false`) — set to `true` via `PATCH /users/me {onboarding_completed: true}`
- `RequireOnboarded` guard in `App.tsx` redirects unonboarded users from all Layout routes to `/onboarding`
- Onboarding page (`pages/Onboarding.tsx`): 3 steps — Welcome → Template pick → Configure & launch
- Skip button available only on the last step (configure)
- After completing or skipping: local store updated **before** API call to prevent redirect loop
- Existing users have `onboarding_completed=true` (set in migration 0009)

## Account deletion

`DELETE /api/v1/users/me` — hard deletes the authenticated user and all their data in order:
1. `DailyTaskInstance` (user_id)
2. `ChallengeInstance` (user_id)
3. `Challenge` (ids collected from instances)
4. `UserDevice` (user_id)
5. `NotificationLog` (user_id)
6. `User`

Frontend: Settings page has a "Delete Account" button (below logout) with `ConfirmModal` confirmation. After deletion: `logout()` + `navigate("/login")`.

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

Migrations: `0001_initial` → ... → `0009_add_onboarding_completed` → `0010_add_notification_times` → `0011_add_notify_task_reminders` → `0012_add_telegram` → `0013_add_weekly_review_notification_type` → `0014_add_streak_protection` → `0015_add_burnout_alert_notification_type` → `0016_add_template_slugs`

PostgreSQL enums require explicit `CAST(:value AS enumtype)` — do NOT use `op.bulk_insert()` with enum columns.

## Challenge type — UI vs backend

The form UI exposes **2 type buttons**: `timed` and `all_day`.
The backend stores **3 types**: `single`, `multi`, `all_day`.

Mapping (frontend → backend at submit):
- `timed` + `tasks_per_day = 1` → `single`
- `timed` + `tasks_per_day > 1` → `multi`
- `all_day` → `all_day`

When loading an existing challenge into the edit form: `single/multi → "timed"`, `all_day → "all_day"`.
This applies to `CreateChallenge.tsx`, `ChallengeDetail.tsx` (edit), and `Onboarding.tsx`.

## DailyTaskOut schema

Key fields in `schemas/daily.py`:
- `sequence_number` / `total_count` — position among sibling tasks for multi-type challenges (null for single/all_day)
- `challenge_status` — status of the parent ChallengeInstance (`active | paused | completed`). Used by frontend to determine editability.

## Streak & analytics

**Streak report** (`GET /reports/streak`):
- `current_streak` — consecutive days with ≥1 completed task going back from today
- `longest_streak` — all-time best
- `grace_day_used` (bool) — True if `streak_protection=true` and 1 missed day was forgiven in current streak
- Paused days are skipped (neither increment nor break the streak)
- Future pending days are excluded (stop at today)

**Streak protection** (`User.streak_protection`, default `true`): 1 missed day per streak run doesn't reset the counter. Grace fires only when `current_streak > 0` at the missed day — never on an empty streak.

**Momentum report** (`GET /reports/momentum`): 14-day weighted completion rate (today = weight 14, 13 days ago = weight 1). Trend: last 7 days vs previous 7 days, ±5% threshold.

**Weekday patterns** (`GET /reports/weekday-patterns`): all-time completion rate per weekday (Mon=index 0 … Sun=index 6). Paused days excluded.

**Recovery analytics** (inside `ChallengeReport`):
- `breaks_count` — days with 0/partial completion after a good streak
- `comebacks_count` — times user recovered after a break
- `avg_comeback_days` — average days to recover (null if no comebacks)
- `resilience_score` — comebacks/breaks × 100 (null if no breaks — metric not applicable)

**Burnout detection**: Celery task checks daily at 12:00 UTC. Triggers if user had 3+ consecutive days with tasks AND <30% completion. 5-day dedup so it doesn't spam.

## Category system (frontend)

`utils/category.ts` detects category from challenge title keywords and returns icon + colors.
Categories: `workout | water | reading | meditation | nosugar | sleep | productivity | mental | default`
Each has unique accent color and icon used across cards, progress bars, badges.

Template name/description translations live in `utils/templateTranslations.ts`.

## Notification dispatch

`notification_service.dispatch()` — sends to all available channels:
1. **Push** — all registered devices (`UserDevice`). Data-only payload `{type, …data, url}`. SW translates using `TRANSLATIONS` dict in `sw.ts`.
2. **Telegram** — if `user.telegram_chat_id` is set, sends `<b>title</b>\nbody` via Bot API.
3. **Email fallback** — only if both push and Telegram unavailable/failed. `notifications_i18n.py` provides translated text.

**Dedup:** morning/evening Celery tasks skip send if same type was successfully sent in last 30 min. Task reminders skip if sent in last 4 min.

**Notification types in `sw.ts` TRANSLATIONS:** `morning_summary`, `daily_report`, `task_reminder`, `weekly_review`, `burnout_alert`

**Dedup windows:** morning/evening/weekly → 30 min | task reminders → 4 min | burnout → 5 days

**Adding a new push notification type:**
- Backend: add value to `NotificationType` enum + migration (`ALTER TYPE notificationtype ADD VALUE`)
- Backend: add `push_data = {"type": "my_type", ...}`, `send_*()` helper, call `dispatch()`
- `notifications_i18n.py`: add translated strings for email/Telegram fallback
- `sw.ts`: add `my_type` entry to the `TRANSLATIONS` object (all 4 languages)
- No other changes needed

**Push subscription lifecycle:**
- `subscribeToPush()` returns device ID — store it in state for clean unsubscribe
- On disable: call `sub.unsubscribe()` + `DELETE /notifications/devices/{id}`

## Telegram bot

User links Telegram account via Settings → "Connect Telegram":
1. `POST /users/me/telegram/generate-code` → one-time code + `bot_url` (`t.me/BotName?start=<code>`)
2. User opens link → presses Start in bot → webhook receives `/start <code>`
3. `POST /telegram/webhook` finds user by `telegram_linking_code`, sets `telegram_chat_id`, clears code
4. Frontend polls `/users/me` every 3s until `telegram_chat_id` appears

`User.telegram_chat_id` (BigInteger) — null if not linked. `User.telegram_linking_code` (String 20) — cleared after use.

**Telegram proxy:** `api.telegram.org` is blocked on Russian VPS. Solution: Cloudflare Worker `tg-proxy.a-shesternina.workers.dev` acts as bidirectional proxy:
- Outbound (VPS → Telegram): Worker rewrites requests to `api.telegram.org`, protected by `X-Proxy-Secret` header
- Inbound (Telegram → VPS): Worker `/webhook` path forwards to `api.tracker.shura.pro/api/v1/telegram/webhook`

Set `TELEGRAM_PROXY_URL` + `TELEGRAM_PROXY_SECRET` in `.env` to enable. Without these, `send_telegram()` falls back to direct `api.telegram.org` (works in EU, fails in Russia).

**Adding a new language to notifications:**
- `sw.ts` `TRANSLATIONS`: add language code to each notification type entry
- `notifications_i18n.py`: add same language to `_MORNING_SUMMARY`, `_DAILY_REPORT`, `_WEEKLY_REVIEW*`, `_BURNOUT_ALERT`
- `language_service.py`: add country codes and add to `SUPPORTED_LANGUAGES`

## Push notification settings (User model)

- `notification_morning_time` (String "HH:MM", default "08:00") — morning summary time in user's timezone
- `notification_evening_time` (String "HH:MM", default "21:00") — evening report time in user's timezone
- `notify_task_reminders` (bool, default false) — send push at each timed task's scheduled_time (±2 min)
- `streak_protection` (bool, default true) — 1 missed day per streak run doesn't break the streak (grace day)

Celery morning/evening tasks run every 5 min and filter users whose local time matches their preference (±4 min window). Task reminders also run every 5 min. Weekly review replaces evening report on Sundays.

## Multilanguage system

**Supported languages:** EN / ES / PT / RU (stored in `User.language`, default `"en"`)

**Language detection on registration:** IP geolocation via `ipapi.co` → country → language; fallback to `Accept-Language` header → `"en"`.

**Language sync flow:**
1. Login/Register → `/users/me` response → `i18n.changeLanguage(user.language)` + `setServiceWorkerLanguage(lang)`
2. Settings change → `PATCH /users/me {language}` + same sync
3. App startup → `setServiceWorkerLanguage(user.language || i18n.language)` (restores SW state after reload)

**Adding UI translations:** Add keys to ALL four locale files: `en.ts`, `ru.ts`, `es.ts`, `pt.ts`.
Use `const { t } = useTranslation()` and `t("section.key")`. Never use inline `i18n.language === "ru" ? ... : ...` — always use `t()`.

**Template translations:** 16 templates × 4 languages live in `utils/templateTranslations.ts` (NOT in i18n locale files — the locale `template_titles` sections were removed as dead code). Template challenges store the **English canonical title** in the DB (`Challenge.title`) and `source_template_id` for reference. Always call `translateTemplateName(title, i18n.language)` when displaying challenge titles — applies to all components (TaskCard, Challenges, DailyTasks, Reports, ChallengeDetail, ChallengeReport).

**Adding a new language:** see README.md → section «Добавление нового языка».

## Celery beat schedule (UTC)

| Task | Schedule | Notes |
|------|----------|-------|
| Generate daily tasks for all users | 00:05 | fixed |
| Auto-complete expired challenges | 00:10 | fixed |
| Morning summary notification | every 5 min | filters by user's `notification_morning_time` ±4 min in their timezone |
| Evening report notification | every 5 min | skips Sundays (weekly review takes over); filters by `notification_evening_time` ±4 min |
| Weekly review notification | every 5 min | Sundays only (user's local timezone); fires at `notification_evening_time`; 30-min dedup |
| Task reminders | every 5 min | sends to users with `notify_task_reminders=true` when timed task is due ±2 min |
| Burnout detection | daily 12:00 UTC | 3+ consecutive days with tasks and <30% completion → supportive push; 5-day dedup |

## Environment

Copy `backend/.env.example` → `backend/.env`. Key variables:
- `SECRET_KEY` — change in production
- `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` — leave empty to use mock push (logs to console). Generate: see README.
- `SENDGRID_API_KEY` — leave empty to use mock email (logs to console)
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_USERNAME` — leave empty to mock Telegram (logs to console)
- `TELEGRAM_PROXY_URL` — Cloudflare Worker URL (e.g. `https://tg-proxy.a-shesternina.workers.dev`); leave empty for direct connection
- `TELEGRAM_PROXY_SECRET` — must match `PROXY_SECRET` env var in the Cloudflare Worker
- `CORS_ORIGINS` — JSON list of allowed origins

## Running tests

```bash
# Install test deps and run all 112 tests (local Docker only)
docker exec challengetracker-backend-1 pip install -r requirements-test.txt -q
docker exec challengetracker-backend-1 pytest tests/ -v --tb=short

# Run a single test
docker exec challengetracker-backend-1 pytest tests/test_auth.py::test_login_success -v
```

⚠️ **CRITICAL: NEVER run pytest on the production server.** Each test truncates ALL tables — this destroys all real user data. Tests must only run on a local Docker stack.

- Local `docker-compose.yml` sets `PYTEST_ALLOW=1` — tests run normally
- Production server does NOT have `PYTEST_ALLOW=1` — pytest is blocked at import time with a clear error
- `pytest` is also not installed in the production image (double protection)

Test files: `test_auth.py` (34) · `test_challenges.py` (18) · `test_daily.py` (11) · `test_reports.py` (16) · `test_new_features.py` (26) · `test_telegram.py` (7)

`conftest.py` uses `drop_all + create_all` before each test session to ensure schema is always up to date with current models.

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
- **Daily backups**: cron at 03:00 UTC dumps DB to `/opt/backups/db_YYYY-MM-DD.gz` (7-day retention) on the VPS. Local pull script: `scripts/pull_backup.ps1` (runs via Windows Task Scheduler at 07:00, saves to `%USERPROFILE%\Backups\ChallengeTracker\`, keeps 14 days). VPS backup script: `/opt/backup_db.sh`.

## Known issues / gotchas

- **bcrypt compatibility**: `bcrypt` is pinned to `4.0.1` — `passlib 1.7.4` reads `bcrypt.__about__.__version__` removed in bcrypt 4.1+
- **Vite HMR on Windows + Docker**: file watching sometimes misses changes — hard-refresh with `Ctrl+Shift+R` or restart container
- **Port 5432**: not exposed to host. Backend connects via internal Docker network (`db:5432`)
- **Frontend date**: Dashboard and DailyTasks always pass `?target_date=YYYY-MM-DD` from the browser to avoid server timezone mismatch
- **VPS git pull**: the remote uses HTTPS (`github.com/AShesternina/ChallengeTracker`). If `git pull` fails with "could not read Username", copy changed files via scp or configure a GitHub deploy key with SSH remote.
- **Desktop sidebar**: uses `position: fixed` (not sticky). Main content has `lg:ml-60` offset. `overflow-x: hidden` is on `html/body` only — do NOT add it to the Layout root div (breaks fixed positioning).
- **ConfirmModal focus trap**: uses `createPortal` to render in `<body>` + sets `inert` on `#root` while open. This is the only correct pattern — previous approaches using keydown interception failed.
- **PWA install prompt**: `beforeinstallprompt` event is captured in `App.tsx` and stored in `installStore`. `InstallBanner` shows on Dashboard (max 2 times, 2-day cooldown). Settings shows install button when not installed. `requireInteraction: true` on all push notifications (stay until dismissed).
- **Public templates**: `/challenge/:slug` route is outside `<RequireAuth>`. `PublicChallenge.tsx` calls `GET /challenges/templates/{slug}` (no auth). After register → onboarding with `?challenge=slug` pre-selects template via `SLUG_TO_TITLE` map in `templateTranslations.ts`.
