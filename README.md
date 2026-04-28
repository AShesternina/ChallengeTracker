# ChallengeTracker

Personal challenge tracking PWA. One day → many tasks ← many challenges.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL 16 |
| Queue | Redis 7 + Celery |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3, PWA |
| Notifications | Web Push API + SendGrid email fallback |
| Auth | JWT (access + refresh), email/password, phone + OTP (mock) |

## Quick Start

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Architecture

```
/backend
  /app
    /api/v1/endpoints   — auth, challenges, daily, reports, notifications, users
    /core               — config, database, security, redis, deps
    /models             — SQLAlchemy ORM models
    /schemas            — Pydantic request/response schemas
    /services           — business logic (auth, challenges, daily tasks, reports, notifications)
    /workers            — Celery app + scheduled tasks
  alembic/              — migrations
/frontend
  /src
    /pages              — Dashboard, DailyTasks, Challenges, Reports, Settings, Auth
    /components         — Layout, TaskCard, ProgressRing
    /services           — api.ts (Axios), push.ts (Web Push)
    /store              — Zustand stores (auth, tasks)
    sw.ts               — Service Worker (Workbox + push handler)
docker-compose.yml
```

## Key Design Decisions

**Day-centric task model**: `DailyTaskInstance` rows are generated lazily on `GET /daily/today` 
(also via nightly Celery beat). Each row belongs to a day AND a `ChallengeInstance`, 
never to a challenge directly. This keeps the daily view simple.

**Notification dispatch**: push-first, email fallback — controlled in `notification_service.py`.  
If no push devices are registered → email. No hardcoded text in backend.

**Backend-first**: API is completely UI-agnostic. Telegram/mobile can plug in by consuming 
the same `/api/v1` endpoints.

## API Overview

```
POST /api/v1/auth/register/email
POST /api/v1/auth/login/email
POST /api/v1/auth/register/phone     # returns OTP in dev mode
POST /api/v1/auth/verify/otp
POST /api/v1/auth/refresh

GET  /api/v1/users/me
PATCH /api/v1/users/me

GET  /api/v1/challenges/templates
POST /api/v1/challenges
POST /api/v1/challenges/start
GET  /api/v1/challenges/my
DELETE /api/v1/challenges/instances/{id}

GET  /api/v1/daily/today             # generates tasks if missing
POST /api/v1/tasks/{id}/complete
POST /api/v1/tasks/{id}/skip

GET  /api/v1/reports/daily/{date}
GET  /api/v1/reports/monthly/{year}/{month}
GET  /api/v1/reports/challenge/{instance_id}

GET  /api/v1/notifications/vapid-public-key
POST /api/v1/notifications/subscribe
GET  /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{id}
```

## Celery Schedule (UTC)

| Task | Time |
|------|------|
| Generate daily tasks | 00:05 |
| Morning summary notification | 08:00 |
| Daily report notification | 21:00 |

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async URL |
| `REDIS_URL` | Redis URL |
| `SECRET_KEY` | JWT signing key (change in production!) |
| `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` | For Web Push (leave empty → mock) |
| `SENDGRID_API_KEY` | For email (leave empty → console mock) |

## Development (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Worker (separate terminal)
celery -A app.workers.celery_app worker --loglevel=info

# Frontend
cd frontend
npm install
npm run dev
```

## User Flow

1. Register at `/register`
2. Pick a template or create a custom challenge
3. Start the challenge → tasks appear on `Today` page
4. Mark tasks done/skipped throughout the day
5. View progress on `Reports` page
6. Enable push notifications in `Settings`
