# ChallengeTracker — Design Brief

> **Self-contained brief for a UI redesign.** Written for an AI designer with no access to the codebase.
> All screenshots are in `design-brief/screenshots/`.

---

## 1. Product Overview

**ChallengeTracker** is a personal habit and challenge tracking PWA where users create multi-week challenges, receive a daily task list generated automatically, mark tasks done or skipped, and review progress through reports.

### Target audience
Non-technical personal productivity users (25–45). They track fitness, reading, hydration, meditation habits. They expect a mobile-first experience similar to Duolingo or Habitica — simple, motivating, minimal friction.

### Core value proposition
Unlike generic to-do apps, ChallengeTracker thinks in **days, not challenge lists**: every morning it generates a unified task list across all active challenges. The user sees one clean "today" screen instead of navigating per-challenge.

### 5 main user flows

| # | Flow | Screens |
|---|------|---------|
| 1 | **Onboarding** | Register → Dashboard (empty) → New Challenge (templates) → Challenge form → Dashboard (with tasks) |
| 2 | **Daily check-in** | Dashboard → Today's Tasks → mark Done/Skip per task |
| 3 | **Create custom challenge** | Challenges list → New Challenge step 1 → step 2 (configure) → Start → back to list |
| 4 | **Review progress** | Reports (monthly heatmap) → pick challenge → Challenge Report (streaks, completion rate) |
| 5 | **Manage running challenge** | Challenges list → tap card → Challenge Detail → Edit → save / Cancel challenge |

---

## 2. Frontend Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | React | 18.3 |
| Language | TypeScript | 5.7 |
| Build tool | Vite | 6.0 |
| CSS | **Tailwind CSS** (utility-first, no CSS-in-JS) | 3.4 |
| UI library | **None** — all components hand-built | — |
| Icons | **Emoji-based** (no icon library). Single SVG eye-toggle in PasswordInput | — |
| Fonts | **System font stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | — |
| Charts | **Custom SVG** — `ProgressRing` (circle arc). No charting lib | — |
| Animations | **CSS transitions only** via Tailwind (`transition-colors`, `transition-all duration-500`) | — |
| Forms | Controlled React state. No form library (react-hook-form etc.) | — |
| Routing | React Router v6 | 6.28 |
| Global state | Zustand | 5.0 |
| API client | Axios with JWT auto-refresh interceptor | 1.7 |
| i18n | i18next + react-i18next + LanguageDetector | 24.x / 15.x |
| PWA | vite-plugin-pwa + Workbox (service worker, offline caching, push handler) | — |

---

## 3. Screen Map (Sitemap)

```
/ (root)
├── /login                  — Email/password sign-in form [PUBLIC]
├── /register               — Email/password registration [PUBLIC]
│
└── [RequireAuth wrapper — redirects to /login if not authenticated]
    ├── /                   — Dashboard: daily summary + quick actions
    ├── /daily              — Today's Tasks: full task list with complete/skip actions
    ├── /challenges         — My Challenges: card list of all instances
    │   ├── /challenges/new     — Create Challenge: 2-step (template picker → config form)
    │   └── /challenges/:id     — Challenge Detail: view + inline edit form
    ├── /reports            — Reports: monthly calendar heatmap
    │   └── /reports/challenge/:id  — Challenge Report: streaks, completion stats
    └── /settings           — Settings: profile, language picker, timezone, push toggle, logout
```

All protected routes share the same **Layout** (top header + bottom tab nav). Auth pages are full-screen standalone.

---

## 4. UI Component Inventory

### Navigation
| Component | File | Used on | Variants |
|-----------|------|---------|----------|
| `Layout` | `components/Layout.tsx` | All protected screens | Fixed header (indigo) + fixed bottom nav (5 tabs) |
| Bottom Tab Nav | inside `Layout` | All protected | 5 items: Dashboard, Today, Challenges, Reports, Settings. Active = indigo, inactive = gray-500 |

### Data display
| Component | File | Used on | Variants |
|-----------|------|---------|----------|
| `ProgressRing` | `components/ProgressRing.tsx` | Dashboard | SVG circle, customizable `size` (default 80px) and `stroke` (default 8px). Track = `#e0e7ff`, progress = `#6366f1` |
| `TaskCard` | `components/TaskCard.tsx` | Daily Tasks, Dashboard preview | Status variants: `pending` (white border), `completed` (green-50 bg + green-200 border), `skipped` (gray-50, opacity-60) |
| Monthly heatmap | inside `Reports.tsx` | Reports | 7-col grid of day squares. Colors: `bg-green-500` (100%), `bg-green-300` (≥50%), `bg-red-200` (<50%), `bg-gray-100` (no tasks) |
| Challenge card | inside `Challenges.tsx` | Challenges list | Clickable `<Link>` card, status badge pill (active=green, paused=yellow, completed=blue, cancelled=gray) |
| Stat card | inside `Dashboard.tsx` | Dashboard | Mini card: emoji icon + large number + label. 3-column grid |
| Info row | inside `ChallengeDetail.tsx` | Challenge Detail | Gray-50 rounded box: label (xs, gray-400) + value (sm, gray-800) |

### Input / Forms
| Component | File | Used on | Variants |
|-----------|------|---------|----------|
| `PasswordInput` | `components/PasswordInput.tsx` | Login, Register | Text input + absolute eye-toggle button (SVG, gray-400 → gray-600 hover) |
| Text input | inline in pages | All forms | `px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500` |
| Textarea | inline | CreateChallenge, ChallengeDetail edit | `resize-none`, 2 rows |
| Select | inline | Settings (timezone) | Native `<select>`, same rounded-xl style |
| Time input | inline | CreateChallenge, ChallengeDetail edit | `<input type="time">` |
| Date input | inline | CreateChallenge, ChallengeDetail edit | `<input type="date">` |
| Number input | inline | CreateChallenge | min/max constraints |
| Toggle switch | inside Settings | Settings (push notifications) | Custom CSS toggle: `h-6 w-11` pill, `bg-primary-600` when on |
| Language picker | inside Settings | Settings | 2-button segmented control (🇷🇺 / 🇬🇧), border-2 highlight for active |

### Actions / Buttons
| Pattern | Classes | States |
|---------|---------|--------|
| Primary CTA | `bg-primary-600 text-white font-semibold rounded-xl py-3` | hover: `bg-primary-700`, disabled: `opacity-50` |
| Secondary / outline | `bg-white border-2 border-primary-200 text-primary-600 rounded-xl` | hover: `bg-primary-50` |
| Danger / destructive | `border-2 border-red-200 text-red-600 rounded-xl` | hover: `bg-red-50` |
| Tab button (auth) | `bg-white shadow text-primary-600` (active) / `text-gray-500` (inactive) | inside `bg-gray-100 p-1 rounded-lg` container |
| Small action | `px-3 py-1.5 text-xs border border-gray-300 rounded-lg` | Skip/Done inside TaskCard |

### Feedback / States
| Pattern | Implementation |
|---------|---------------|
| Loading spinner | `animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600` centered in flex container |
| Error message | `bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3` |
| Empty state | Emoji (5xl) + heading (gray-600) + hint text (sm, primary-600 link) |
| Save confirmation | Button text changes to "✓ Saved!" for 2s |
| Progress bar | `h-2 bg-gray-100 rounded-full` track + `bg-primary-600 rounded-full transition-all duration-500` fill |

---

## 5. Current Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#eef2ff` | Auth page gradient start, progress ring focus |
| `primary-100` | `#e0e7ff` | ProgressRing track color |
| `primary-500` | `#6366f1` | ProgressRing arc, active nav links, focus rings |
| `primary-600` | `#4f46e5` | **Main brand color** — header bg, primary buttons, active nav text |
| `primary-700` | `#4338ca` | Button hover state |
| `gray-50` | `#f9fafb` | Page background, skipped task bg, info row bg |
| `gray-100` | `#f3f4f6` | Heatmap empty, tab switcher bg, progress track |
| `gray-200` | `#e5e7eb` | Borders (light), task card dividers |
| `gray-300` | `#d1d5db` | Input borders, skip button border |
| `gray-400` | `#9ca3af` | Placeholder text, secondary icons, timestamps |
| `gray-500` | `#6b7280` | Inactive nav labels, secondary text |
| `gray-600` | `#4b5563` | Body text, form labels |
| `gray-700` | `#374151` | — |
| `gray-800` | `#1f2937` | Primary text, headings, card titles |
| `green-50` | `#f0fdf4` | Completed task card bg |
| `green-100` | `#dcfce7` | Completed task badge bg |
| `green-200` | `#bbf7d0` | Completed task card border |
| `green-300` | `#86efac` | Heatmap ≥50% days |
| `green-500` | `#22c55e` | Heatmap 100% days |
| `green-600` | `#16a34a` | Completed task ✓ icon, badge text |
| `red-200` | `#fecaca` | Heatmap <50% days, danger button border |
| `red-500` | `#ef4444` | Error text (challenge report bad rate) |
| `red-600` | `#dc2626` | Danger button text |
| `yellow-100` | `#fef9c3` | Paused status badge bg |
| `yellow-600` | `#ca8a04` | Paused status text, medium completion rate |
| `blue-100` | `#dbeafe` | Completed challenge status badge |
| `blue-700` | `#1d4ed8` | Completed challenge status text |
| `indigo-100` | `#e0e7ff` | Auth gradient end (shares with primary-100) |

**No dark mode.** Light-only.

### Typography

| Element | Classes | Computed |
|---------|---------|----------|
| Page h1/h2 | `text-2xl font-bold text-gray-800` | 24px, 700 |
| Section h3 | `font-semibold text-gray-700` | 16px, 600 |
| Card title | `font-semibold text-gray-800` | 16px, 600 |
| App name (auth) | `text-3xl font-bold text-primary-600` | 30px, 700 |
| Body / labels | `text-sm text-gray-600` | 14px, 400 |
| Secondary / hints | `text-sm text-gray-500` | 14px, 400 |
| Timestamps / captions | `text-xs text-gray-400` | 12px, 400 |
| Large stats | `text-2xl font-bold text-gray-800` | 24px, 700 |
| Progress % | `text-lg font-bold text-primary-600` | 18px, 700 |
| Button text | `font-semibold` or `font-medium` | 14–16px, 600 |
| Badge text | `text-xs font-medium` | 12px, 500 |

**Font family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (native system font, no web fonts loaded).

### Spacing & Geometry

**Base spacing**: Tailwind default (4px grid). Commonly used: `p-4` (16px), `p-6` (24px), `p-8` (32px), `py-3` (12px), `gap-3` (12px), `gap-6` (24px), `mb-4` (16px).

**Border radius**:
- Cards: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Buttons: `rounded-xl` (12px)
- Inputs: `rounded-xl` (12px)
- Badges/pills: `rounded-full`
- Heatmap squares: `rounded-sm` (2px)
- Tab containers: `rounded-lg` (8px), `rounded-md` (6px)

**Shadows**:
- Cards: `shadow-sm` (subtle) or `shadow-xl` (auth modal)
- Hover cards: `hover:shadow-md`
- Bottom nav: `shadow-lg`

**Borders**: `border border-gray-100` (light cards), `border-2 border-primary-200` (secondary button), `border-2 border-red-200` (danger button), `border border-gray-300` (inputs)

**Breakpoints**: Tailwind defaults (`sm: 640px`, `md: 768px`, `lg: 1024px`). App uses `max-w-2xl` (672px) centered container — effectively a wide-mobile column on all screen sizes.

**Max content width**: 672px (`max-w-2xl`) — the whole app is a single centered column. No sidebar, no multi-column layout.

### Transitions & Motion

All animations are CSS-only via Tailwind:
- `transition-colors` — button/nav color changes
- `transition-all` — card borders on hover
- `duration-500` — progress bar fill animation
- `animate-spin` — loading spinner (CSS animation)
- No JS animation libraries (no Framer Motion, no GSAP)

Focus rings: `focus:ring-2 focus:ring-primary-500 focus:outline-none`

---

## 6. Content & Copy

### Real text examples (English)

**Dashboard**: "Hey, Alex! 👋" / "Today's progress" / "4 remaining" / "Quick Actions" / "📋 Today's Tasks" / "➕ New Challenge"

**Daily Tasks**: "Today's Tasks" / "All done for today!" / "No tasks today!" / "Start a challenge to see tasks here."

**Challenges**: "My Challenges" / "No challenges yet" / "Start your first challenge →" / status badges: "active", "paused", "completed", "cancelled"

**Create Challenge** (step 1): "New Challenge" / "✨ Start from scratch" / "Templates" / "30 days · 1×/day"
**Create Challenge** (step 2): "Title *" / "e.g. Morning Workout" / "Type" / "⏰ Single" / "🔁 Multi" / "🌅 All Day" / "Duration (days)" / "Tasks/day" / "Scheduled times" / "Start date" / "🚀 Start Challenge"

**Reports**: "Total tasks" / "Completed" / "Rate" / "Daily completion" / legend: "100%", "50%+", "<50%", "No tasks"

**Challenge Report**: "Current streak 🔥" / "Best streak 🏆" / "Period" / "Completion"

**Settings**: "Profile" / "Language" / "Timezone" / "Push Notifications" / "Web push" / "Enabled" / "Sign Out"

**Errors**: "Something went wrong" / "Action failed" / "Login failed" / "Registration failed" / "Failed to create challenge"

### Challenge types & data
| Type | Icon | Meaning | Example |
|------|------|---------|---------|
| `single` | ⏰ | One task at specific time | Morning Workout at 07:00 |
| `multi` | 🔁 | Multiple tasks per day | Water Intake at 09:00, 13:00, 18:00 |
| `all_day` | 🌅 | Open task, anytime | Reading Habit |

### Template library (5 built-in)
Morning Workout (💪), Reading Habit (📚), Meditation (🧘), No Sugar (🚫🍬), Water Intake (💧)

### Date format
`d MMMM yyyy` / `EEEE, d MMMM` — localized via date-fns (EN: "Wednesday, 29 April 2026", RU: "среда, 29 апреля 2026")

### Language
Bilingual EN/RU. Detected from `ct_language` localStorage key, fallback to browser locale, fallback to `en`. All UI strings are translated. Language toggled in Settings.

### Empty states

| Screen | Empty state |
|--------|-------------|
| Dashboard | Shows zeros in all stats, quick action buttons still visible |
| Daily Tasks | 🎉 "No tasks today!" + "Start a challenge to see tasks here." |
| Challenges | 🎯 "No challenges yet" + "Start your first challenge →" link |
| Challenge Report | — (not reachable without instances) |

---

## 7. Screenshots

All screenshots captured at realistic data (active user with 3 challenges, 15 tasks today, 2 completed + 1 skipped).

### Auth
![Login desktop](design-brief/screenshots/01-login-desktop.webp)
*Login — email form on indigo gradient background. Centered white card (max-w-md).*

![Login mobile](design-brief/screenshots/01-login-mobile.webp)
*Login mobile (390×844)*

![Register desktop](design-brief/screenshots/02-register-desktop.webp)
*Register — same card style as Login*

![Register mobile](design-brief/screenshots/02-register-mobile.webp)

### Dashboard
![Dashboard desktop](design-brief/screenshots/03-dashboard-desktop.webp)
*Dashboard — progress ring (40%), stat grid (Active/Completed/Skipped), quick action buttons, task preview list*

![Dashboard mobile](design-brief/screenshots/03-dashboard-mobile.webp)

![Dashboard empty](design-brief/screenshots/12-dashboard-empty-desktop.webp)
*Dashboard empty state — all zeros, buttons still visible*

### Daily Tasks
![Daily Tasks desktop](design-brief/screenshots/04-daily-desktop.webp)
*Daily Tasks — progress bar, task cards with Done/Skip buttons, status-colored states*

![Daily Tasks mobile](design-brief/screenshots/04-daily-mobile.webp)

![Daily Tasks empty](design-brief/screenshots/13-daily-empty-desktop.webp)
*Daily Tasks empty — 🎉 emoji + hint text*

### Challenges
![Challenges desktop](design-brief/screenshots/05-challenges-desktop.webp)
*Challenges list — clickable cards with status badge, date range, › arrow*

![Challenges mobile](design-brief/screenshots/05-challenges-mobile.webp)

![Challenges empty](design-brief/screenshots/14-challenges-empty-desktop.webp)
*Challenges empty — 🎯 + CTA link*

### Create Challenge
![Create Step 1 desktop](design-brief/screenshots/06-new-challenge-step1-desktop.webp)
*Create Challenge step 1 — dashed "from scratch" button + template cards*

![Create Step 1 mobile](design-brief/screenshots/06-new-challenge-step1-mobile.webp)

![Create Step 2 desktop](design-brief/screenshots/07-new-challenge-step2-desktop.webp)
*Create Challenge step 2 — config form: title, description, type segmented control, duration, tasks/day, time inputs, date picker*

![Create Step 2 mobile](design-brief/screenshots/07-new-challenge-step2-mobile.webp)

### Challenge Detail
![Challenge Detail desktop](design-brief/screenshots/08-challenge-detail-desktop.webp)
*Challenge Detail — progress bar, info grid (dates, days left, tasks/day, type), action buttons*

![Challenge Detail mobile](design-brief/screenshots/08-challenge-detail-mobile.webp)

### Reports
![Reports desktop](design-brief/screenshots/09-reports-desktop.webp)
*Monthly Reports — month navigation, 3 summary cards, calendar heatmap grid with legend*

![Reports mobile](design-brief/screenshots/09-reports-mobile.webp)

![Challenge Report desktop](design-brief/screenshots/10-challenge-report-desktop.webp)
*Challenge Report — 6-stat grid (total, completed, skipped, rate, streaks), period row, completion bar*

![Challenge Report mobile](design-brief/screenshots/10-challenge-report-mobile.webp)

### Settings
![Settings desktop](design-brief/screenshots/11-settings-desktop.webp)
*Settings — 4 sections (Profile, Language, Timezone, Push Notifications) + Sign Out*

![Settings mobile](design-brief/screenshots/11-settings-mobile.webp)

---

## 8. ASCII Wireframes

### Dashboard (desktop, 1440px wide — centered max-w-2xl column)

```
┌──────────────────────────────────────────────────────────┐
│ ChallengeTracker                                [header] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Hey, Alex! 👋                                          │
│  Wednesday, 29 April 2026                               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ┌───────┐   Today's progress                    │   │
│  │  │ Ring  │   4/10                                │   │
│  │  │  40%  │   4 remaining                         │   │
│  │  └───────┘                                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 🎯  6   │  │ ✅  4   │  │ ⏭️  2   │             │
│  │ Active  │  │Completed │  │ Skipped  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  Quick Actions                                           │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │  📋 Today's Tasks  │  │  ➕ New Challenge   │        │
│  │  [primary button]  │  │  [outline button]   │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
│  Tasks Today                                             │
│  ┌──────────────────────────────┬────────────┐          │
│  │ Morning Workout   07:00      │ completed  │          │
│  ├──────────────────────────────┼────────────┤          │
│  │ Water Intake      09:00      │ completed  │          │
│  ├──────────────────────────────┼────────────┤          │
│  │ Water Intake      13:00      │  pending   │          │
│  └──────────────────────────────┴────────────┘          │
│  View all 15 tasks →                                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  🏠       📋        🎯        📊        ⚙️             │
│ Home    Today  Challenges  Reports  Settings   [bot nav] │
└──────────────────────────────────────────────────────────┘
```

### Daily Tasks

```
┌──────────────────────────────────────────────────────────┐
│ ChallengeTracker                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Today's Tasks                                           │
│  Wednesday, 29 April                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Progress                              4/15        │   │
│  │ ████████░░░░░░░░░░░░░░░░░░░░░░  27%             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────┬───────┬───────┐        │
│  │ Water Intake     13:00       │ Skip  │ Done  │        │
│  │ multi                        │       │       │        │
│  ├──────────────────────────────┼───────┼───────┤        │
│  │ Reading Habit                │ Skip  │ Done  │        │
│  │ all day                      │       │       │        │
│  ├──────────────────────────────┴───────┴───────┤        │
│  │ ✓  Morning Workout   07:00        [completed] │        │
│  ├──────────────────────────────────────────────┤        │
│  │ ✓  Water Intake      09:00        [completed] │        │
│  ├──────────────────────────────────────────────┤        │
│  │     Water Intake     18:00         [skipped]  │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Challenge Detail

```
┌──────────────────────────────────────────────────────────┐
│ ChallengeTracker                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ←  Morning Workout                         [active]    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Daily exercise to boost energy                    │   │
│  │                                                    │   │
│  │ Progress   3 / 30 days                    10%     │   │
│  │ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │   │
│  │                                                    │   │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │ │  Start   │  │   End    │  │ Days left│         │   │
│  │ │ 29 Apr   │  │ 29 May   │  │  27 📅   │         │   │
│  │ └──────────┘  └──────────┘  └──────────┘         │   │
│  │ ┌──────────┐  ┌──────────┐                        │   │
│  │ │Tasks/day │  │  Times   │                        │   │
│  │ │    1     │  │  07:00   │                        │   │
│  │ └──────────┘  └──────────┘                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌───────────────────┐  ┌───────────────────┐           │
│  │  ✏️ Edit           │  │  📊 Report         │           │
│  └───────────────────┘  └───────────────────┘           │
│  ┌──────────────────────────────────────────────┐        │
│  │  Cancel this challenge                        │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Create Challenge — Step 2 (form)

```
┌──────────────────────────────────────────────────────────┐
│ ChallengeTracker                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ←  Customize                                            │
│                                                          │
│  Title *                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Morning Workout                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Description                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Daily morning exercise session                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Type                                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │ ⏰ Single │  │ 🔁 Multi  │  │🌅 All Day │           │
│  │ [active]  │  │           │  │           │           │
│  └───────────┘  └───────────┘  └───────────┘           │
│                                                          │
│  Duration (days)    Tasks/day                            │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │      30      │  │      1       │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                          │
│  Scheduled times                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  07:00                                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Start date                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  2026-04-29                                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │          🚀 Start Challenge                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Reports — Monthly Heatmap

```
┌──────────────────────────────────────────────────────────┐
│ ChallengeTracker                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Reports                                                 │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │   ←         April 2026          →                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │     45     │  │     12     │  │    27%      │        │
│  │ Total tasks│  │ Completed  │  │    Rate     │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  Daily completion                                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  M   T   W   T   F   S   S                        │  │
│  │                  1   2   3   4   5                 │  │
│  │  6   7   8   9  10  11  12                         │  │
│  │  ░   ░   ░   █   █   ░   ░  ← colored squares     │  │
│  │ 13  14  15  16  17  18  19                         │  │
│  │ 20  21  22  23  24  25  26                         │  │
│  │ 27  28  29  30                                     │  │
│  │                                                    │  │
│  │ ■ 100%  ▒ 50%+  ░ <50%  □ No tasks               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Component Trees

### Dashboard

```
Dashboard
├── ProgressRing (SVG circle, size=90, stroke=8)
├── StatCard × 3 (Active / Completed / Skipped)
│   └── [emoji] + number + label
├── [Link] → /daily  "📋 Today's Tasks" [primary button]
├── [Link] → /challenges/new  "➕ New Challenge" [outline button]
└── task preview list (first 3 tasks)
    └── div × 3
        ├── challenge_title + scheduled_time
        └── status badge (completed/skipped/pending)
```

### Daily Tasks

```
DailyTasks
├── date header
├── progress bar card
│   └── div.h-2 (track) + div.bg-primary-600 (fill, width = % computed)
├── [loading spinner] | [empty state] | task list
└── task list (pending first, then done/skipped)
    └── TaskCard × N
        ├── challenge_title
        ├── scheduled_time (if set)
        ├── type label
        └── [status = pending]
            ├── button "Skip" → POST /tasks/:id/skip
            └── button "Done" → POST /tasks/:id/complete
            [status = completed] → "✓" green checkmark
            [status = skipped] → "skip" gray text
```

---

## 10. Redesign Context & Constraints

### Must preserve
- **Route structure** — same URLs, same `RequireAuth` guard pattern
- **PWA capability** — must work offline, installable, service worker
- **Bilingual EN/RU** — all strings must stay in i18n files, nothing hardcoded
- **Bottom tab navigation pattern** — 5 fixed tabs, this is the primary nav paradigm on mobile
- **Day-centric mental model** — "Today" tab is the hero screen, not "Challenges"
- **API contract** — backend is unchanged; frontend just needs to call the same endpoints

### Known UX problems in current design
1. **Username in greeting shows email prefix** — "Hey, design-brief-active! 👋" looks technical
2. **No visual hierarchy on Dashboard** — progress ring, stat cards, quick actions, task list all feel equal weight
3. **Create Challenge is a 2-step flow but step indicator is not visible** — users don't know they're on step 1 of 2
4. **Challenge Detail "Edit" reveals inline form** — the transition is abrupt, no animation
5. **Monthly report heatmap numbers are tiny** — day numbers (12px) inside 20-30px squares are hard to read on mobile
6. **No confirmation feedback after completing a task** — the card just changes color; no celebratory micro-interaction
7. **Settings page has no visual section separators beyond card borders** — feels flat
8. **Empty state on Dashboard shows 0s in stat cards** — "0 Active" with a 🎯 emoji is not motivating for new users
9. **Bottom nav icons are emoji** — emoji rendering varies wildly across OSes; inconsistent visual weight

### Technical constraints
- **Pure SPA** — no SSR/SSG. All routing is client-side (React Router). This means full freedom for JS-driven animations.
- **No component library** — can introduce one (shadcn/ui, Radix) if desired
- **No icon library** — recommend replacing emoji nav icons with a real library (Lucide, Heroicons)
- **CSS approach** — Tailwind is the constraint. Can add CSS modules or styled-components alongside, but Tailwind must remain for build to work
- **Accessibility**: Currently minimal — no `aria-label` on icon buttons, no skip links, no focus trap in any modal-like pattern. Improving a11y is a recommended redesign goal.
- **Mobile-first** — max-w-2xl centered column means desktop is essentially a wide-mobile view. A true responsive 2-column desktop layout would require routing/layout changes.

---

## 11. File Structure (frontend UI)

```
frontend/src/
├── App.tsx                    # Route definitions + RequireAuth guard
├── main.tsx                   # Entry point, PWA registration, i18n import
├── index.css                  # Tailwind base/components/utilities
├── vite-env.d.ts
│
├── components/
│   ├── Layout.tsx             # Header + bottom nav + <Outlet>
│   ├── PasswordInput.tsx      # Password field with eye toggle
│   ├── ProgressRing.tsx       # SVG circular progress indicator
│   └── TaskCard.tsx           # Daily task card (pending/done/skipped)
│
├── pages/
│   ├── Login.tsx              # Email/password sign-in
│   ├── Register.tsx           # Email/password registration
│   ├── Dashboard.tsx          # Home: ring + stats + quick actions + task preview
│   ├── DailyTasks.tsx         # Full today task list with complete/skip
│   ├── Challenges.tsx         # List of user's challenge instances
│   ├── CreateChallenge.tsx    # 2-step: template picker → config form
│   ├── ChallengeDetail.tsx    # View + inline edit form for one challenge
│   ├── Reports.tsx            # Monthly heatmap calendar
│   ├── ChallengeReport.tsx    # Per-challenge stats: streaks, completion
│   └── Settings.tsx           # Profile, language, timezone, push, logout
│
├── services/
│   ├── api.ts                 # Axios instance + all API calls grouped by domain
│   └── push.ts                # Web Push subscription helper
│
├── store/
│   ├── authStore.ts           # Zustand: user, tokens, setTokens, logout
│   └── taskStore.ts           # Zustand: daily summary, updateTask
│
└── i18n/
    ├── index.ts               # i18next init (LanguageDetector, EN/RU resources)
    └── locales/
        ├── en.ts              # English strings
        └── ru.ts              # Russian strings
```

---

## Open Questions

1. **Target platform priority** — is mobile (390px) the primary viewport, or should desktop get a real 2-column layout in the redesign? The current max-w-2xl single-column works fine for mobile but wastes space on 1440px screens.

2. **Brand identity** — is "indigo/purple" (#4f46e5) the locked brand color, or is the color palette open for redesign? Can we change the primary hue?

3. **Component library** — is it acceptable to introduce shadcn/ui or Radix UI primitives (Dialog, Tooltip, Select, etc.)? Or must the redesign stay with hand-built components only?

4. **Icon strategy** — should emoji icons in the bottom nav be replaced with a vector icon library (Lucide, Heroicons)? Emoji is inconsistent across platforms.

5. **Desktop layout** — should the redesign introduce a true desktop layout (sidebar + main content area), or keep the centered column and improve it?

6. **Gamification / motivation** — the current design is utilitarian. Should the redesign add motivational elements (streaks visualization, progress celebrations, trophy icons)?

7. **Dark mode** — is dark mode a requirement for the redesign, or nice-to-have?

8. **Onboarding flow** — new users see an empty Dashboard. Should the redesign include a proper onboarding (empty-state CTA, walkthrough, first challenge wizard)?
