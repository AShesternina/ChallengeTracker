# ChallengeTracker

Персональное приложение для трекинга привычек и челленджей. Пользователь создаёт многонедельные челленджи, каждое утро получает единый список задач на день по всем активным челленджам, отмечает задачи выполненными или пропущенными и отслеживает прогресс через отчёты.

**Основная идея:** ChallengeTracker мыслит **днями, а не списком челленджей**. Каждое утро система автоматически формирует единый список задач по всем активным челленджам — пользователь видит один чистый экран «Сегодня».

---

## Технический стек

| Слой | Технология |
|------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 async, Alembic, Celery |
| База данных | PostgreSQL 16 |
| Очередь / Кэш | Redis 7 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3, PWA |
| Состояние | Zustand 5.0 |
| Роутинг | React Router v6 |
| API клиент | Axios + JWT auto-refresh |
| i18n | i18next (EN / RU) |
| Уведомления | Web Push (pywebpush) + SendGrid email fallback |
| Auth | JWT (access + refresh), email/password |

---

## Быстрый старт

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

---

## Разделы приложения

Навигация: **5 вкладок** — Главная / Сегодня / Челленджи / Отчёты / Настройки.

### 🏠 Главная (Dashboard)

- Прогресс сегодня — круговой индикатор с процентом и счётчиком `выполнено / всего`
- Три статы — Активные челленджи / Выполнено сегодня / Пропущено сегодня
- Быстрые действия — «Задачи на сегодня» и «Новый челлендж»
- Превью задач — первые 3 задачи дня со статусом
- Streak 🔥 — счётчик дней подряд

### 📋 Сегодня (Daily Tasks)

Два режима просмотра (переключатель):

**По задачам** — все задачи всех челленджей единым списком: сначала ожидающие, затем выполненные/пропущенные.

**По челленджам** — задачи сгруппированы по челленджам. Каждая карточка группы показывает иконку, прогресс-бар за сегодня, счётчик. Тап → провал внутрь с задачами только этого челленджа.

Карточка задачи содержит: иконку категории, название, время, бейдж `N из M` для multi-задач, бейдж «весь день» для all_day, кнопки **Готово** / **Пропуск** / **↩ Отмена**.

Прогресс-бар в header обновляется при отметке задач.

### 🎯 Челленджи (Challenges)

**Список:** карточки с иконкой категории, статус-бейджем, прогресс-баром (% дней), диапазоном дат.

**Создание (2 шага):**
- Шаг 1 — выбор шаблона (Morning Workout 💪 / Reading 📚 / Meditation 🧘 / Water 💧 / No Sugar 🚫) или с нуля
- Шаг 2 — название, описание, тип (⏰ single / 🔁 multi / 🌅 all_day), длительность, время, дата начала

**Детали:** прогресс дней, инфо-сетка, текущая серия 🔥 и лучшая серия 🏆, кнопки Редактировать / Отчёт / Отменить.

### 📊 Отчёты (Reports)

**Месячный:** навигация по месяцам, 3 статы, тепловая карта (🟩 100% / 🟢 50%+ / 🟥 <50% / ⬜ нет задач), список активных челленджей с прогресс-барами.

**По челленджу:** 6 метрик (Всего / Выполнено / Пропущено / % / Серия 🔥 / Лучшая 🏆), период, прогресс-бар.

### ⚙️ Настройки (Settings)

Профиль, тёмная тема, язык (RU/EN), часовой пояс, web push уведомления, выход.

---

## Типы задач

| Тип | Иконка | Описание | Пример |
|-----|--------|----------|--------|
| `single` | ⏰ | Одна задача в конкретное время | Morning Workout в 07:00 |
| `multi` | 🔁 | Несколько задач в день | Water Intake в 09:00, 12:00, 15:00, 19:00 |
| `all_day` | 🌅 | Открытая задача без времени | Reading Habit |

## Категории

| Категория | Иконка | Цвет |
|-----------|--------|------|
| workout | 💪 | Оранжевый |
| water | 💧 | Голубой |
| reading | 📚 | Зелёный |
| meditation | 🧘 | Фиолетовый |
| nosugar | 🚫 | Серый |

## Статусы челленджей

| Статус | Цвет | Описание |
|--------|------|----------|
| `active` | 🟢 | Идёт, задачи генерируются |
| `paused` | 🟡 | Приостановлен |
| `completed` | 🔵 | Все дни пройдены |
| `cancelled` | ⚫ | Отменён |

## Статусы задач

| Статус | Описание |
|--------|----------|
| `pending` | Ожидает выполнения |
| `completed` | Выполнена |
| `skipped` | Пропущена |

---

## Архитектура

**Day-centric model**: `DailyTaskInstance` генерируются лениво при `GET /daily/today` (и ночным Celery beat). Каждая запись принадлежит дню И `ChallengeInstance`, никогда напрямую челленджу.

```
backend/app/
  api/v1/endpoints/   — auth, challenges, daily, reports, notifications, users
  core/               — config, database, security, redis, deps
  models/             — SQLAlchemy ORM
  schemas/            — Pydantic schemas
  services/           — вся бизнес-логика
  workers/            — Celery app + scheduled tasks
alembic/              — миграции

frontend/src/
  components/         — Layout, TaskCard, ProgressRing, Icons, PasswordInput
  pages/              — все экраны
  store/              — authStore, taskStore, themeStore
  services/           — api.ts, push.ts
  utils/              — category.ts (определение категории по названию)
  i18n/locales/       — en.ts, ru.ts
```

---

## API

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
DELETE /api/v1/challenges/instances/{id}           # cancel (soft)
POST /api/v1/challenges/instances/{id}/pause
POST /api/v1/challenges/instances/{id}/resume
DELETE /api/v1/challenges/instances/{id}/permanent # hard delete (cancelled only)

GET  /api/v1/daily/today
POST /api/v1/tasks/{id}/complete
POST /api/v1/tasks/{id}/skip
POST /api/v1/tasks/{id}/reset                      # revert to pending

GET  /api/v1/reports/streak
GET  /api/v1/reports/daily/{date}
GET  /api/v1/reports/monthly/{year}/{month}
GET  /api/v1/reports/challenge/{instance_id}

GET  /api/v1/notifications/vapid-public-key
POST /api/v1/notifications/subscribe
GET  /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{id}
```

---

## Celery расписание (UTC)

| Задача | Время |
|--------|-------|
| Генерация дневных задач | 00:05 |
| Утреннее уведомление | 08:00 |
| Вечерний отчёт | 21:00 |

---

## Переменные окружения

Скопируй `backend/.env.example` → `backend/.env`:

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `REDIS_URL` | Redis URL |
| `SECRET_KEY` | JWT signing key (менять в production!) |
| `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` | Web Push (пусто → mock) |
| `SENDGRID_API_KEY` | Email (пусто → console mock) |
| `CORS_ORIGINS` | JSON-список разрешённых origins |

---

## Деплой (production)

- **Frontend**: Vercel — автодеплой из ветки master → tracker.shura.pro
- **Backend + DB + Redis**: VPS 195.133.194.173, docker-compose.prod.yml
- **SSL**: Let's Encrypt через certbot + nginx для api.tracker.shura.pro
- **DNS**: Porkbun — tracker.shura.pro → Vercel, api.tracker.shura.pro → 195.133.194.173

```bash
# На сервере
cd /opt/challengetracker
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Тесты

```bash
docker exec challengetracker-backend-1 bash -c \
  "pip install -r requirements-test.txt -q && pytest tests/ -v --tb=short --cov=app --cov-report=term-missing"
```

53 теста: test_auth (11) · test_challenges (8) · test_daily (9) · test_reports (6) · test_new_features (19)
