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
| Уведомления | Web Push data-only + SW-перевод; Telegram (rich HTML + кнопки); Resend/SendGrid email |
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

**Онбординг:** новый пользователь после регистрации попадает на визард — Приветствие (3 категории-тизера + «все категории») → Категория → Шаблоны → Настройка и запуск. На последнем шаге есть кнопка «Пропустить». После онбординга флаг `onboarding_completed` сохраняется в профиле.

Навигация: **5 вкладок** — Главная / Сегодня / Челленджи / Отчёты / Настройки.

### 🏠 Главная (Dashboard)

- **Hero-карточка** (кликабельна → Сегодня) — круговой индикатор, счётчик `выполнено / всего`, **Momentum badge** (14-дневный взвешенный % с трендом ↑/→/↓)
- **Streak** 🔥 — счётчик дней подряд в заголовке; ⚡ если grace day использован
- **Карточки активных челленджей** — иконка + название + прогресс X/Y за сегодня (кликабельны → детали)
- **Превью задач** — первые 3 задачи дня со статусом (read-only) + «Все N →»

### 📋 Сегодня (Daily Tasks)

Два таба: **Задачи** / **Мои челленджи**.

**Задачи** — все задачи всех челленджей единым списком (ожидающие → выполненные/пропущенные). Прогресс вынесен в заголовок: счётчик `X/Y` + тонкая линия под заголовком.

**Мои челленджи** — полное управление: три таба Активные / Пауза / Завершённые со счётчиками. Карточки кликабельны → страница челленджа. Внизу кнопка «Новый челлендж» → библиотека.

Карточка задачи: иконка категории, название, время, бейдж `N из M` для multi-задач, бейдж «весь день» для all_day, кнопки **Готово** / **Пропуск** / **↩ Отмена**.

### 🎯 Челленджи (Challenges) — Библиотека шаблонов

Главный экран — сетка из 9 категорий. Тап на категорию → список 4 шаблонов. Тап на шаблон → форма создания с предзаполненными параметрами. Кнопка «Создать с нуля» → пустая форма напрямую (без шага выбора шаблона, `?scratch=1`).

**9 категорий:** Здоровье и питание · Спорт · Образование · Ментальное здоровье · Продуктивность · Быт и порядок · Финансы · Отказ от привычек · Отношения

**Управление «Мои челленджи»** перенесено в раздел Сегодня (второй таб).

**Детали челленджа** (`/challenges/:id`): прогресс дней, инфо-сетка, текущая серия 🔥 и лучшая серия 🏆, кнопки Редактировать / Отчёт / Приостановить (или Возобновить) / Повторить (для завершённых) / Удалить навсегда.

### 📊 Отчёты (Reports)

**Месячный заголовок:** навигация ← Май 2026 →, прогресс-бар выполнения за месяц, статы (всего задач · выполнено · %) — всё в одной карточке.

**Тепловая карта:** 🟩 100% / 🟢 50%+ / 🟠 <50% / 🔵 предстоящие / ⬜ нет задач. В каждой ячейке — число дня + % выполнения (только для прошедших дней с данными).

**Кликабельные дни:** любой день с задачами открывает детальный вид (задачи рендерятся через общий `TaskCard`):
- Прошлое / сегодня → полное редактирование (Готово / Пропуск / ↩ Отмена)
- Будущее → только просмотр, бейдж «Будущее · только просмотр»
- Задачи паузированного челленджа → затемнены, нередактируемы, метка статуса

**Trends** (только текущий месяц): автоматические текстовые выводы на основе данных — лучший/сложный день недели, выходные vs будни, тренд momentum, текущая серия, стабильность ритма.

**По челленджу:** 6 метрик (Всего / Выполнено / Пропущено / % / Серия 🔥 / Лучшая 🏆), период, прогресс-бар.

**Recovery analytics:** Срывы / Возвращения / Среднее возвращение (дней) / Resilience % (= возвращений/срывов×100; null если срывов не было).

### ⚙️ Настройки (Settings)

**Заголовок страницы:** аватар + имя (нажать карандаш ✏️ — появляется input с кнопками ✓/✕; пустое значение очищает имя до null) + email. Справа — переключатель темы (◑/☀️/🌙).

**РЕГИОН** — аккордеон-секция: строка «Язык» (тап → раскрывается сетка языков, после выбора закрывается автоматически) + строка «Часовой пояс» (тап → select, авто-сохранение без кнопки). Текущие значения видны в строке.

**Push-уведомления:** toggle вкл/выкл + тайм-пикеры утреннего/вечернего уведомлений + toggle «Напоминать во время задачи».

**Email-отчёты** (видна только верифицированным пользователям): toggle «📊 Итоги дня» — HTML-письмо каждый вечер (пн–сб) с разбивкой по челленджам; toggle «🏆 Итоги недели» — письмо каждое воскресенье. Имя в письмах: `user.name` или `email.split("@")[0]` если имя не задано.

**⚡ Защита серии:** toggle — один пропущенный день не ломает серию (grace day). Включена по умолчанию.

**Telegram:** подключение аккаунта через one-time code. После связки уведомления дублируются в Telegram. Отправка через Cloudflare Worker прокси.

**Установить приложение:** InstallBanner на Dashboard + кнопка в Настройках. iOS: Share → Add to Home Screen.

**Удаление аккаунта** — кнопка внизу с подтверждением через ConfirmModal.

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
| reading | 📖 | Зелёный |
| meditation | 🧘 | Фиолетовый |
| nosugar | 🚫 | Серый |
| sleep | 😴 | Индиго |
| productivity | ⚡ | Жёлтый |
| mental | 🌿 | Изумрудный |
| education | 📚 | Синий |
| home | 🧹 | Тауп |
| finance | 💰 | Зелёный |
| quit | 🚭 | Красный |
| relationships | ❤️ | Розовый |

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
alembic/              — миграции (0001 → ... → 0021)

frontend/src/
  components/         — Layout, TaskCard, ProgressRing, Icons, PasswordInput, ConfirmModal, InstallBanner
  pages/              — Dashboard, DailyTasks, Challenges, CreateChallenge, ChallengeDetail, ChallengeReport, Reports, Settings, ChangePassword, Login, Register, Onboarding, PublicChallenge, VerifyEmail
  store/              — authStore (user incl. name + tokens + language + theme + onboarding + notif prefs + streak_protection + telegram_chat_id), taskStore, themeStore (system/light/dark), installStore
  services/           — api.ts, push.ts, sw-lang.ts, telegramApi
  utils/              — category.ts (13 категорий), templateTranslations.ts (36 шаблонов × 4 языка + 9 категорий + SLUG_TO_TITLE)
cloudflare/           — Telegram proxy Worker (telegram-proxy/worker.js)
  i18n/locales/       — en.ts, ru.ts, es.ts, pt.ts
  sw.ts               — Service Worker: кэш + push-перевод через IndexedDB (5 типов уведомлений)
```

---

## API

```
POST /api/v1/auth/register/email
POST /api/v1/auth/login/email
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/users/me
PATCH /api/v1/users/me                             # name, timezone, language, onboarding_completed, notification_morning_time, notification_evening_time, notify_task_reminders, notify_email_daily, notify_email_weekly, streak_protection, theme
DELETE /api/v1/users/me                            # удалить аккаунт и все данные
POST /api/v1/users/me/change-password              # {current_password, new_password}
POST /api/v1/users/me/telegram/generate-code       # one-time linking code
DELETE /api/v1/users/me/telegram                   # отвязать Telegram

GET  /api/v1/auth/verify-email?token=              # верификация email (публичный)
POST /api/v1/auth/resend-verification              # повторно отправить ссылку

GET  /api/v1/challenges/templates
GET  /api/v1/challenges/templates/{slug}   # публичный — без авторизации
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

GET  /api/v1/reports/streak                        # {current_streak, longest_streak, grace_day_used}
GET  /api/v1/reports/momentum                      # 14-day weighted completion + trend
GET  /api/v1/reports/weekday-patterns              # completion rate Mon–Sun across all history
GET  /api/v1/reports/daily/{date}
GET  /api/v1/reports/monthly/{year}/{month}
GET  /api/v1/reports/challenge/{instance_id}       # + recovery analytics

GET  /api/v1/notifications/vapid-public-key
POST /api/v1/notifications/subscribe               # upsert by endpoint
POST /api/v1/notifications/resubscribe             # no-auth; вызывается SW при pushsubscriptionchange
GET  /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{id}
```

---

## Celery расписание (UTC)

| Задача | Расписание | Примечание |
|--------|-----------|------------|
| Генерация дневных задач | 00:05 | фиксировано |
| Автозавершение истёкших челленджей | 00:10 | фиксировано |
| Утреннее уведомление | каждые 5 мин | фильтр по `notification_morning_time` ±4 мин в таймзоне юзера |
| Вечерний отчёт | каждые 5 мин | пн–сб; фильтр по `notification_evening_time` ±4 мин |
| Weekly review | каждые 5 мин | только воскресенье (локальный timezone); dedup 30 мин |
| Напоминания по задачам | каждые 5 мин | только если `notify_task_reminders=true`, ±2 мин от scheduled_time |
| Email дневной отчёт | каждые 5 мин | пн–сб; `notify_email_daily=true` + `is_verified=true`; Redis dedup 23ч |
| Email недельный отчёт | каждые 5 мин | только воскресенье; `notify_email_weekly=true` + `is_verified=true`; Redis dedup 6 дней |
| Burnout detection | 12:00 UTC | 3+ дня подряд <30% → поддерживающий push; dedup 5 дней |

---

## Переменные окружения

Скопируй `backend/.env.example` → `backend/.env`:

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `REDIS_URL` | Redis URL |
| `SECRET_KEY` | JWT signing key (менять в production!) |
| `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` | Web Push (пусто → mock) |
| `RESEND_API_KEY` | Email через Resend (рекомендуется; пусто → SendGrid или mock) |
| `SENDGRID_API_KEY` | Email через SendGrid (fallback если нет RESEND_API_KEY; пусто → mock) |
| `FRONTEND_URL` | URL фронтенда для ссылок в письмах (напр. `https://tracker.shura.pro`) |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API токен (пусто → mock) |
| `TELEGRAM_BOT_USERNAME` | Username бота без @ (для генерации ссылок) |
| `TELEGRAM_PROXY_URL` | Cloudflare Worker URL для проксирования Telegram (пусто → прямое подключение) |
| `TELEGRAM_PROXY_SECRET` | Секрет для Worker (должен совпадать с `PROXY_SECRET` в Cloudflare) |
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
2. **`notifications_i18n.py`** — добавить запись `"fr"` в `_MORNING_SUMMARY`, `_DAILY_REPORT`, `_WEEKLY_REVIEW*`, `_BURNOUT_ALERT`
3. **`sw.ts`** — добавить `"fr"` в каждый тип в `TRANSLATIONS` (5 типов); добавить в `SUPPORTED_LANGS`
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

133 тестов: test_auth (48) · test_challenges (21) · test_daily (11) · test_reports (16) · test_new_features (29) · test_telegram (8)
