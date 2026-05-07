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
| i18n | i18next (EN / ES / PT / RU, язык в аккаунте пользователя) |
| Уведомления | Web Push data-only + SW-перевод; SendGrid email fallback |
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
- Streak 🔥 — счётчик дней подряд в шапке
- Недельный мини-график — столбики последних 7 дней с цветом по проценту выполнения
- Быстрые действия — «Задачи на сегодня» и «Новый челлендж»
- Превью задач — первые 3 задачи дня со статусом

### 📋 Сегодня (Daily Tasks)

Два режима просмотра (переключатель):

**По задачам** — все задачи всех челленджей единым списком: сначала ожидающие, затем выполненные/пропущенные.

**По челленджам** — задачи сгруппированы по челленджам. Каждая карточка группы показывает иконку, прогресс-бар за сегодня, счётчик. Тап → провал внутрь с задачами только этого челленджа.

Карточка задачи содержит: иконку категории, название, время, бейдж `N из M` для multi-задач, бейдж «весь день» для all_day, кнопки **Готово** / **Пропуск** / **↩ Отмена**.

Прогресс-бар в header обновляется при отметке задач.

### 🎯 Челленджи (Challenges)

**Фильтр:** три таба — Активные / Пауза / Завершённые. Счётчик на каждом табе.

**Список:** карточки с иконкой категории, статус-бейджем, прогресс-баром (% дней), диапазоном дат.

**Создание (2 шага):**
- Шаг 1 — выбор шаблона (Morning Workout 💪 / Reading 📚 / Meditation 🧘 / Water 💧 / No Sugar 🚫) или с нуля
- Шаг 2 — название, описание, тип (⏰ single / 🔁 multi / 🌅 all_day), длительность, время, дата начала
- Если дата окончания уже прошла — показывается confirm; челлендж сразу попадает в Завершённые

**Повторить:** кнопка на странице завершённого челленджа открывает предзаполненную форму (шаг 2) с датой начала = сегодня. Все параметры можно изменить перед запуском.

**Детали:** прогресс дней, инфо-сетка, текущая серия 🔥 и лучшая серия 🏆, кнопки Редактировать / Отчёт / Приостановить (или Возобновить) / Повторить (для завершённых) / Удалить навсегда.

### 📊 Отчёты (Reports)

**Месячный:** навигация по месяцам, 3 статы, тепловая карта (🟩 100% / 🟢 50%+ / 🟠 <50% прошлые / 🔵 предстоящие / ⬜ нет задач), список активных челленджей с прогресс-барами.

**Кликабельные дни:** любой день с задачами открывает детальный вид:
- Прошлое / сегодня → полное редактирование (Готово / Пропуск / ↩ Отмена)
- Будущее → только просмотр, бейдж «Будущее · только просмотр»
- Задачи паузированного челленджа → затемнены, нередактируемы, метка статуса

**По челленджу:** 6 метрик (Всего / Выполнено / Пропущено / % / Серия 🔥 / Лучшая 🏆), период, прогресс-бар.

### ⚙️ Настройки (Settings)

Профиль, тёмная тема, язык (English / Español / Português / Русский), часовой пояс, web push уведомления, выход. Язык сохраняется в аккаунте и применяется на всех устройствах.

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

## Статусы задач

| Статус | Описание |
|--------|----------|
| `pending` | Ожидает выполнения |
| `completed` | Выполнена |
| `skipped` | Пропущена |

---

## Архитектура

**Day-centric model**: `DailyTaskInstance` принадлежит дню И `ChallengeInstance`, никогда напрямую челленджу.

Задачи генерируются тремя способами:
1. `POST /challenges/start` — сразу весь период (прошлое + будущее через `ensure_daily_tasks` в цикле)
2. `GET /daily/today` — ленивая идемпотентная генерация для конкретного дня
3. Celery beat 00:05 UTC — ночная генерация для всех активных и паузированных челленджей

**Паузы:** `ChallengeInstance.pause_periods` хранит историю пауз в JSON: `[{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD|null"}]`. Задачи паузированного дня видны в списке (затемнены), но исключены из всех статистик и стрика.

**Мультиязычность:** язык хранится в `User.language` (EN/ES/PT/RU). При регистрации определяется автоматически по IP. Шаблонные челленджи хранят английское каноническое название (`Challenge.title`) и переводятся на фронте. Push-уведомления отправляются без текста — Service Worker переводит по языку из IndexedDB.

```
backend/app/
  api/v1/endpoints/   — auth, challenges, daily, reports, notifications, users
  core/               — config, database, security, redis, deps
  models/             — SQLAlchemy ORM
  schemas/            — Pydantic schemas
  services/           — вся бизнес-логика (в т.ч. language_service, notifications_i18n)
  workers/            — Celery app + scheduled tasks
alembic/              — миграции (0001 → ... → 0008)

frontend/src/
  components/         — Layout, TaskCard, ProgressRing, Icons, PasswordInput, ConfirmModal
  pages/              — все экраны
  store/              — authStore (+ language), taskStore, themeStore
  services/           — api.ts, push.ts, sw-lang.ts
  utils/              — category.ts, templateTranslations.ts (16 шаблонов × 4 языка)
  i18n/locales/       — en.ts, ru.ts, es.ts, pt.ts
  sw.ts               — Service Worker: кэш + push-перевод через IndexedDB
```

---

## API

```
POST /api/v1/auth/register/email
POST /api/v1/auth/login/email
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/users/me
PATCH /api/v1/users/me

GET  /api/v1/challenges/templates
POST /api/v1/challenges
POST /api/v1/challenges/start
GET  /api/v1/challenges/my
GET  /api/v1/challenges/instances/{id}
PATCH /api/v1/challenges/instances/{id}
POST /api/v1/challenges/instances/{id}/pause
POST /api/v1/challenges/instances/{id}/resume
DELETE /api/v1/challenges/instances/{id}/permanent # hard delete — any status, tasks removed

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
| Автозавершение истёкших челленджей | 00:10 |
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

## Добавление нового языка

Пример: французский (`fr`). Затрагивает 7 файлов, миграций не нужно.

1. **`language_service.py`** — добавить коды стран в `_COUNTRY_LANGUAGE` (`"FR": "fr"` и т.д.), добавить `"fr"` в `SUPPORTED_LANGUAGES`
2. **`notifications_i18n.py`** — добавить запись `"fr"` в `_MORNING_SUMMARY` и `_DAILY_REPORT`
3. **`sw.ts`** — добавить `"fr"` в каждый тип в `TRANSLATIONS`; добавить в `SUPPORTED_LANGS`
4. **`i18n/locales/fr.ts`** — новый файл (скопировать структуру из `en.ts`, перевести все строки)
5. **`i18n/index.ts`** — импортировать `fr` + добавить в `resources` и `supportedLngs`
6. **`templateTranslations.ts`** — добавить колонку `fr` в `TITLE_MAP`, `DESC_MAP`, `TEMPLATE_CATEGORIES`; обновить тип `TemplateLang` и функцию `toLang()`
7. **`Settings.tsx`** — добавить `{ code: "fr", label: "Français", flag: "🇫🇷" }` в массив `LANGUAGES` (алфавитный порядок)

---

## Тесты

```bash
docker exec challengetracker-backend-1 bash -c \
  "pip install -r requirements-test.txt -q && pytest tests/ -v --tb=short --cov=app --cov-report=term-missing"
```

76 тестов: test_auth (20) · test_challenges (15) · test_daily (11) · test_reports (8) · test_new_features (22)
