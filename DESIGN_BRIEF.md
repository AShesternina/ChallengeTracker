# ChallengeTracker — New Design Brief (v3)

> **Redesign spec** based on UI exploration session (May 2026).  
> Direction: **Focus + Pulse** — dark-capable productivity with emotional category colors.  
> Prototype reference: `Prototype.html` (interactive, light/dark, mobile + desktop).  
> Last updated: May 2026 — compact layout pass, momentum badge, recovery analytics, notifications.

---

## 1. Design Direction

### Concept: Focus + Pulse
A hybrid of two directions:

- **Focus** (Linear / Arc / Vercel) — clean surfaces, strong typographic hierarchy, no decorative noise, purposeful data density.
- **Pulse** (Duolingo / Streaks) — category color system, streak mechanic, emotional connection to habits through color-coded progress.

### What changed from v1
| Area | Before | After |
|------|--------|-------|
| Brand color | `#4f46e5` cool indigo | `#5b4cf5` warm violet (light) / `#7c6dfa` (dark) |
| Background | `#f9fafb` cold gray | `#f5f4f2` warm off-white |
| Nav icons | Emoji (🏠📋🎯📊⚙️) | Stroke/filled SVG — outline inactive, filled active |
| Task cards | Flat white, no category | Color-coded by challenge category |
| Daily screen | Flat list | Timeline + grouped views with challenge sections |
| Dark mode | None | Full dark theme with toggle |
| Desktop | Centered column | Sidebar (240px) + content area |
| Greeting | Email prefix | First name only ("Привет, Алекс") |
| Streak | Not shown | 🔥 + count in dashboard header |

---

## 2. Color System

### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#f5f4f2` | Page background (warm off-white) |
| `surface` | `#ffffff` | Cards, inputs, nav |
| `surface2` | `#f0eeeb` | Secondary surfaces, stat backgrounds |
| `border` | `#e8e5e0` | Card borders, dividers |
| `borderStrong` | `#d4cfc8` | Input borders, button outlines |
| `textPrimary` | `#18181b` | Headings, card titles |
| `textSecondary` | `#71717a` | Labels, descriptions |
| `textTertiary` | `#a1a1aa` | Timestamps, hints, placeholders |
| `accent` | `#5b4cf5` | Primary brand — buttons, progress, active nav |
| `accentHover` | `#4a3de0` | Button hover state |
| `accentSoft` | `#ede9fe` | Accent backgrounds, chips, hero card bg |
| `accentMid` | `#c4b5fd` | Outline button borders |
| `green` | `#16a34a` | Completed status, success |
| `greenBg` | `#dcfce7` | Completed task card background |
| `red` | `#dc2626` | Skipped/danger, error text |
| `redBg` | `#fee2e2` | Skipped task background |
| `yellow` | `#ca8a04` | Paused status |
| `yellowBg` | `#fef9c3` | Paused badge background |
| `blue` | `#2563eb` | Completed challenge status |
| `blueBg` | `#dbeafe` | Completed challenge badge background |
| `navBg` | `#ffffff` | Bottom nav / sidebar background |
| `headerBg` | `#ffffff` | Sticky header background (with blur) |

### Dark Theme

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0f0f13` | Page background |
| `surface` | `#18181f` | Cards, inputs |
| `surface2` | `#222229` | Secondary surfaces |
| `border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `borderStrong` | `rgba(255,255,255,0.14)` | Visible borders |
| `textPrimary` | `#f4f4f5` | Primary text |
| `textSecondary` | `#a1a1aa` | Secondary text |
| `textTertiary` | `#52525b` | Disabled/hint text |
| `accent` | `#7c6dfa` | Brand accent (lighter for dark bg) |
| `accentSoft` | `rgba(124,109,250,0.15)` | Soft accent fill |
| `green` | `#4ade80` | Success |
| `greenBg` | `rgba(74,222,128,0.12)` | Success fill |
| `red` | `#f87171` | Danger |
| `redBg` | `rgba(248,113,113,0.12)` | Danger fill |
| `navBg` | `rgba(15,15,19,0.92)` | Nav with blur |
| `headerBg` | `rgba(15,15,19,0.92)` | Header with blur |

### Category Colors

Each challenge type has a semantic color used for: card border accent, icon background, progress bar, category badge.

| Category | Light accent | Light bg | Dark accent | Dark bg |
|----------|-------------|----------|-------------|---------|
| workout (💪) | `#f97316` | `#fff7ed` | `#fb923c` | `rgba(251,146,60,0.12)` |
| water (💧) | `#0ea5e9` | `#f0f9ff` | `#38bdf8` | `rgba(56,189,248,0.12)` |
| reading (📚) | `#16a34a` | `#f0fdf4` | `#4ade80` | `rgba(74,222,128,0.12)` |
| meditation (🧘) | `#8b5cf6` | `#f5f3ff` | `#a78bfa` | `rgba(167,139,250,0.12)` |
| nosugar (🍭) | `#71717a` | `#f4f4f5` | `#a1a1aa` | `rgba(161,161,170,0.12)` |
| sleep (😴) | `#6366f1` | `#eef2ff` | `#818cf8` | `rgba(129,140,248,0.12)` |
| productivity (⚡) | `#f59e0b` | `#fffbeb` | `#fbbf24` | `rgba(251,191,36,0.12)` |
| mental (🌿) | `#10b981` | `#ecfdf5` | `#34d399` | `rgba(52,211,153,0.12)` |

---

## 3. Typography

**Font family**: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`  
No web fonts loaded — system stack only.

| Element | Size | Weight | Color token | Notes |
|---------|------|--------|-------------|-------|
| App name (header) | 15px | 800 | `accent` | Letter-spacing: -0.3px |
| Page title (h1) | 22px | 800 | `textPrimary` | Letter-spacing: -0.5px |
| Section header | 13px | 700 | `textSecondary` | Uppercase, letter-spacing: 0.8px |
| Card title | 15px | 700–800 | `textPrimary` | |
| Body / label | 14px | 500–600 | `textPrimary` | |
| Secondary text | 13px | 400–500 | `textSecondary` | |
| Caption / hint | 11–12px | 500–600 | `textTertiary` | |
| Large stat number | 22–36px | 800–900 | `textPrimary` | Letter-spacing: -0.8px to -1.5px |
| Progress % | 13px | 700 | `accent` | |
| Button text | 13–14px | 700 | depends on variant | |
| Badge text | 10–11px | 700 | depends on variant | |
| Time label | 11px | 600–800 | `accent` or `textTertiary` | |

---

## 4. Spacing & Geometry

**Base unit**: 4px grid (Tailwind default)

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 8px | Small buttons, badges, heatmap cells |
| `radius.md` | 12px | Inputs, buttons, stat cards |
| `radius.lg` | 16px | Task cards, challenge cards, content cards |
| `radius.xl` | 20px | Hero cards, modals, auth card |
| `radius.full` | 9999px | Pills, badges, avatars |

**Page padding**: `16–20px` horizontal  
**Card padding**: `14–16px`  
**Gap between cards**: `10–12px`  
**Section gap**: `20–24px`

**Shadows**:
| Name | Value | Usage |
|------|-------|-------|
| `sm` | `0 1px 4px rgba(0,0,0,0.06)` | Subtle card lift |
| `md` | `0 4px 16px rgba(0,0,0,0.08)` | Hover state |
| `lg` | `0 8px 32px rgba(0,0,0,0.12)` | Auth modal |
| `accent` | `0 4px 14px rgba(91,76,245,0.3)` | Primary button |

---

## 5. Component Specifications

### Bottom Navigation
- 5 tabs: Главная / Сегодня / Челленджи / Отчёты / Настройки
- Icons: **stroke SVG** (1.9px, inactive) → **filled SVG** (active)
- Active state: icon pill background `accentSoft` (36×28px, radius 10px) + label color `accent` + weight 700
- Inactive: icon color `textTertiary`, label 9px weight 500
- Background: `navBg` + `backdrop-filter: blur(20px)` + top border `navBorder`
- Height: ~60px + safe area padding
- **No emoji** — SVG only

### Desktop Sidebar
- Width: 240px, `position: fixed`, full viewport height (`h-screen`), `top-0 left-0`, z-index 40
- Main content has `lg:ml-60` to avoid overlap
- Logo: 15px, weight 900, color `accent`
- Nav items: icon (18px) + label (14px), active = `accentSoft` bg + `accent` color, radius 12px
- Bottom: avatar + name/email + dark mode toggle — always visible at bottom (flex-col layout)
- Border-right: `border`
- Note: do NOT add `overflow-x: hidden` to the Layout root div — breaks fixed positioning. It belongs on `html, body` only.

### Header (sticky)
- Height: ~56px
- Background: `headerBg` + `backdrop-filter: blur(16px)`
- Border-bottom: `border`
- Back button: arrow-left icon, color `textSecondary`
- Title: 15px weight 700 `textPrimary`

### Progress Ring (SVG)
- Track: `accentSoft` (light) / `rgba(accent,0.2)` (dark)
- Arc: `accent` color, strokeLinecap: round
- Percentage text inside: 14px weight 700, color `accent`
- Default size: 72–80px, stroke: 7–8px

### Progress Bar
- Track: `surface2`, height 5–6px, radius 3px
- Fill: `accent` (or category color), transition `width 0.4s`
- For completed state: fill with `green`

### Task Card
- Background:
  - pending → `surface` + category border `accent+'35'`
  - completed → `greenBg` + border `green+'44'`
  - skipped → `surface2` + `border`, opacity 0.55
- Category icon box: 40×40px, radius 10px, bg = `catBg`
- When completed: icon replaced with checkmark (green)
- Name: 14px weight 700, `textSecondary` (muted, no strikethrough) when done — green bg + checkmark are sufficient done signal
- Time row: clock icon (11px) + time (11px weight 600)
- Note: 11px `textSecondary`, truncated
- Multi-task badge: `"N из M"`, 10px weight 800, `accent` pill
- All-day badge: `"весь день"`, 10px, `accent` pill
- Actions: "Пропуск" outline btn + "Готово" accent btn
- Undo: "↩" ghost btn when done/skipped

### Challenge Card (list)
- Category icon: 36×36px, radius 10px, bg = `catBg`
- Title: 15px weight 700, description: 12px `textSecondary`
- Status badge (pill): active=green, paused=yellow, completed=blue, cancelled=gray
- Progress bar under content
- Date range: 11px `textTertiary`
- Chevron right: `textTertiary`
- Hover: `shadow.md` + `translateY(-1px)`

### Hero Progress Card (Dashboard)
- Full-width gradient: `accent → #4a3de0 → #2563eb`
- Contains: ProgressRing (white arc, 76px) + large number (34px) + label + **MomentumBadge** (right, after vertical divider)
- Decorative circles: `rgba(255,255,255,0.08)` positioned absolute
- Radius: `radius.xl`

### Momentum Badge (inline in Hero card)
- Only shown when `days_tracked > 0`
- Right-aligned after `border-l border-white/20 pl-4`
- Score: 22px weight 900 white
- Trend: 10px bold, white opacity varies (up=90%, stable=70%, down=60%)
- Caption "Momentum": 9px white/50
- Metric: weighted 14-day completion (today = weight 14, 13 days ago = weight 1)

### Challenge Report — Recovery Analytics
- Shown when `resilience_score !== null`
- Section title: "Recovery Analytics"
- 4-cell grid: Resilience % (accent) / Avg comeback days / Breaks count / Comebacks count
- Resilience = comebacks / breaks × 100, capped at 100%

### Stat Card (mini)
- Background: `surface`, border: `border`, radius: `radius.md`
- Number: 22px weight 900
- Label: 10px `textTertiary`
- Icon: 15px, inside 24×24 rounded bg chip
- Color overrides: green for completed, warning for skipped

### Buttons
| Variant | Background | Color | Border | Radius |
|---------|-----------|-------|--------|--------|
| Primary | `accent` | white | none | `radius.md` |
| Outline | transparent | `accent` | `2px accentMid` | `radius.md` |
| Ghost | transparent | `textSecondary` | `2px border` | `radius.md` |
| Danger | transparent | `red` | `2px redBg` | `radius.md` |
| Small done | `accent` | white | none | `radius.sm` |
| Small skip | transparent | `textSecondary` | `1.5px borderStrong` | `radius.sm` |

Primary button shadow: `0 2px 8px accent+'40'`

### Input Fields
- Background: `surface`
- Border: `1.5px solid border`, on focus: `accent`
- Radius: `radius.md`
- Padding: `12px 14px`
- Font: 14px `textPrimary`
- Placeholder: `textTertiary`
- Transition: `border-color 0.15s`

### Badges / Pills
- Status active: `greenBg` bg, `green` text, 11px weight 700, `border-radius: 99px`
- Status paused: `yellowBg` / `yellow`
- Status completed: `blueBg` / `blue`
- Category badge: `catBg` / `catAccent`
- Day counter: `accent+'18'` / `accent`

### Toggle Switch
- Track: 44×24px, radius 12px
- Active: `accent` bg; inactive: `surface2` bg
- Thumb: 18×18px white circle, left: 2px (off) / 22px (on)
- Transition: `left 0.2s`, `background 0.2s`

---

## 6. Screen-by-Screen Specs

### Login / Register
- Full-screen gradient background: `accentSoft → bg` (160deg)
- Centered white card: `radius.xl`, `shadow.lg`, padding 36px
- App name: 26px weight 900, `accent`
- Email + password inputs with eye-toggle (SVG)
- Primary CTA button full-width
- "No account? Register" link: `accent` weight 700

### Dashboard
**Header**: date (11px `textTertiary`) + greeting 20px weight 900 + streak pill (🔥 + count) — no logo, no avatar

**Hero card**: gradient purple→blue, ProgressRing (white, 76px) + "2/15" large number (34px) + "N осталось"  
**Momentum badge** (inline, right side of hero card, separated by vertical divider):  
- Score: 22px weight 900 white  
- Trend label: 10px (↑ Better / → Stable / ↓ Lower)  
- Caption: "Momentum" 9px white/50  
- Shown only when days_tracked > 0

**Stats row**: 3 equal StatCards — Active / Done (green) / Skipped (warning)

**Active challenges section**: per-challenge cards below stats  
- Category icon (32×32) + title (13px bold) + X/Y counter + thin progress bar (1px) + Report link  
- Report link → `/reports/challenge/:id`

**Quick actions**: 2-column grid — Primary "Задачи сегодня" + Ghost "Новый челлендж"

**Tasks preview**: max 3 compact TaskCards (readOnly variant), "View all N →" link

### Daily Tasks
**Header**: sticky, title + date + `done/total` pill + progress bar + view toggle

**View toggle**: "По времени" | "По челленджам" — segmented control in `surface2`

**Timeline view** ("По времени"):
- Left column (44px): time label in `accent` weight 800, vertical connector line
- Right: TaskCard with `showChallengeName=true` (challenge name badge)
- Tasks sorted strictly by time ascending; all-day tasks at bottom
- Multiple tasks at same time slot grouped under one time label

**Grouped view** ("По челленджам"):
- Challenge section card: icon + name + day badge + today progress bar + overall % + chevron
- **Collapsed**: compact time pills row at bottom showing each task slot (tappable)
- **Expanded** (tap to open): inner timeline with time labels + full TaskCards
- Chevron rotates 90° when open

**All-done state**: green banner with 🎉

### Challenges List
- "+ Новый" button in header (accent filled)
- Challenge cards with category icon, progress bar, date range, status badge
- Hover lift effect

### Challenge Detail
- Large category icon (52×52, radius 14)
- Title 22px weight 800 + description
- Progress card: "N / M дней" + ProgressBar
- Info grid: 2-column, 6 cells (Start / End / Days left / Tasks/day / Type / Time)
- Streak card: "Текущая серия 🔥" + "Лучшая 🏆" side by side
- Actions: 2-column Outline (Edit + Report) + Pause/Resume + full-width Danger (Delete permanently)

### Create Challenge Step 1
- Step indicator (not previously present in v1): pill steps "1 → 2"
- "Начать с чистого листа": dashed border, `accentSoft` bg, accent icon + text
- Template cards: emoji icon + name + meta (days × per-day)

### Create Challenge Step 2
- Step indicator: filled circle "1" + line + outlined circle "2"
- Fields: Title, Description (textarea), Type segmented (⏰/🔁/🌅), Duration, Tasks/day, Time (hidden for all-day), Start date
- Type segmented control: 3 equal buttons, active = `accentSoft` border + bg
- CTA: "🚀 Запустить челлендж" primary full-width

### Reports
- **Month header card** (single card): `← Май 2026 →` nav row + thin progress bar (color-coded: green ≥80% / yellow ≥50% / red >0%) + stats row ("55 задач · 11 выполнено" left, large "20%" right). Spinner inline when loading.
- **Heatmap**: 7-col grid, rectangular cells (`minHeight: 44px`), `gap-1.5`, rounded-md corners
  - Inside each cell: day number (13px bold) + completion % (9px, only for past days with data)
  - 100%: `green` bg, white text
  - ≥50%: semi-green bg, white text
  - <50%: `#FED7AA` bg, `#C2410C` text
  - upcoming: `info-bg` / `info` (blue)
  - no tasks: `surface2`, muted text
  - today: `accent` ring outline
- Legend: 5 squares + labels (100% / 50%+ / <50% / Upcoming / No tasks)
- **Trends section** (only on current month, only when weekday data exists): auto-generated insights with colored left-border pills (green=positive, blue=neutral, yellow=warning)
- Per-challenge list: icon + name + ProgressBar + chevron
- Day drill-down uses shared `TaskCard` component (not a separate component)

### Settings
- Section headers: 11px uppercase `textTertiary`
- Rows in Card: label (14px) + right element
- Sections:
  - **Profile**: email, timezone
  - **Appearance**: dark mode toggle
  - **Language**: segmented control (EN / RU / ES / PT)
  - **Push Notifications**: web push toggle; when enabled → morning time picker + evening time picker + task reminders toggle
  - **Telegram**: connect/disconnect (Telegram Bot for notifications; "coming soon" if bot unreachable)
  - **Danger zone**: Delete Account (ConfirmModal)
- Sign Out: full-width Ghost button above danger zone

---

## 7. Icon System

**Library**: Custom stroke SVG (Lucide-style)  
**Default stroke**: 1.9px, strokeLinecap: round, strokeLinejoin: round  
**Size**: 18–20px in nav, 15–16px in buttons, 11–12px inline  

**Behavior**:
- Inactive nav / default: `stroke` variant, color `textTertiary`
- Active nav / filled state: `filled` variant, color `accent`

**Required icons** (minimum set):
`home`, `list`, `target`, `bar`, `gear`, `check`, `plus`, `arrow_left`, `arrow_right`, `eye`, `eye_off`, `bell`, `moon`, `sun`, `edit`, `trash`, `clock`, `calendar`, `flame`, `trophy`, `skip`, `chevron_right`, `x`, `rocket`

---

## 8. Dark Mode

Toggle: available in Settings page + sidebar (moon/sun icon) + fixed button top-right in dev/prototype.

All tokens listed in Section 2 have dark equivalents. Key differences:
- Backgrounds use near-black `#0f0f13` / `#18181f` / `#222229`
- Borders are rgba white overlays
- Category colors are lighter/more saturated for legibility
- Nav and header use `backdrop-filter: blur` with semi-transparent bg
- Accent shifts from `#5b4cf5` to `#7c6dfa` (lighter for dark contrast)
- Status colors shift to pastel versions on dark fills

---

## 9. Layout

### Mobile (primary)
- Viewport: 390px
- Content padding: 16–20px horizontal
- Fixed bottom nav: ~60px
- Fixed sticky header: ~56px
- Scrollable content area between header and nav
- Max-width: none (full-bleed on mobile)

### Desktop
- Left sidebar: 240px fixed, full height
- Content area: flex-1, max-width 672px centered, scrollable
- No bottom nav on desktop — sidebar replaces it
- Same screen components used on both, bottom nav hidden in desktop layout

---

## 10. Motion & Transitions

All animations are CSS-only (no JS animation libraries):

| Interaction | Animation |
|------------|-----------|
| Button hover | `background 0.15s ease` |
| Card hover | `box-shadow 0.15s`, `transform 0.1s` (translateY -1px) |
| Progress bar fill | `width 0.4s ease` |
| Task card status change | `all 0.2s ease` (bg, border, opacity) |
| Challenge group expand | chevron `transform rotate 0.2s` |
| Dark mode toggle | `background 0.3s` on body |
| Toggle switch thumb | `left 0.2s`, `background 0.2s` |
| Header blur | `backdrop-filter: blur(16–20px)` |
| Heatmap cell hover | `transform: scale(1.1) 0.1s` |
| Nav active pill | `background 0.15s` |

---

## 11. UX Patterns Introduced (new vs v1)

### Daily Tasks — Two View Modes
1. **По времени** (Timeline): all tasks from all active challenges sorted chronologically. Left column shows time, right column shows task card with challenge name badge. All-day tasks appear at bottom.
2. **По челленджам** (Grouped): challenge sections, each collapsible. Collapsed = header + compact time pills. Expanded = inner timeline with full task cards and Done/Skip actions.

Multi-task challenges (e.g. Water Intake 4×/day, Meditation 2×/day) show all instances in time order with "N из M" badge.

### Streak Mechanic
- 🔥 + day count shown in Dashboard header
- Motivational, not gamified to excess — no animations/sounds

### Category Color System
Each challenge category has a dedicated color that propagates to:
- Task card border + icon background
- Progress bar fill (inside challenge group)
- Category badge / chip
- Heatmap per-challenge rows (future)

### Undo Actions
Completed and skipped tasks show ↩ button to revert to pending.

### Step Indicator in Create Challenge
Two-step flow now has visual indicator: filled circle (step 1) → connector line → outlined circle (step 2).

---

## 12. Known Issues / Next Steps

✅ = реализовано

1. ✅ **Heatmap interactivity**: clicking a day cell shows task detail view with Done/Skip/Undo actions
2. ✅ **Celebration micro-interaction**: CelebrationBanner with bounce + 3 emoji particles (🎉✨🔥) flying in different directions; keyframes in index.css; fires when pendingActive (excl. paused) == 0
3. ✅ **Empty states / Onboarding**: 3-step modal for new users
4. ✅ **Challenge templates**: step 1 template cards pre-fill step 2 form with translated title/description
5. ✅ **Reports per-challenge**: active challenges list with progress bars after heatmap, links to Challenge Report
6. **Accessibility**: add `aria-label` to all icon-only buttons, implement focus trap in modals
7. ✅ **Push notifications settings**: morning/evening time pickers + task reminders toggle + streak protection toggle
8. **Offline banner**: PWA offline state indicator needed
9. ✅ **Pause/Resume challenge**: buttons on ChallengeDetail when active/paused
10. ✅ **Delete challenge**: permanent delete button (any status) on ChallengeDetail
11. ✅ **Streak counter on Dashboard**: 🔥 + day count pill; ⚡ when grace day used
12. ✅ **Momentum score**: 14-day weighted completion rate, inline in hero card with trend label (↑/→/↓)
13. ✅ **Recovery analytics**: breaks / comebacks / resilience % / avg comeback days in Challenge Report
14. ✅ **Active challenge cards on Dashboard**: per-challenge today progress (X/Y) + thin bar + Report link
15. ✅ **Telegram notifications**: linking flow via one-time code; send_telegram on morning/evening/task events
16. ✅ **Weekly review**: Sunday evening push replacing daily report; "42/56 · 75% ↑" + best challenge in Telegram
17. ✅ **Weekday patterns**: horizontal bars Mon–Sun with % completion in Reports (below heatmap)
18. ✅ **Streak protection grace day**: User.streak_protection toggle in Settings; ⚡ badge on Dashboard
19. ✅ **Burnout detection**: 3+ consecutive days <30% → supportive push; dedup 5 days; daily 12:00 UTC
20. ✅ **Trends (Smart insights)**: text conclusions on Reports page — best/worst day, weekday vs weekend, momentum trend, streak, consistency. Shown only on current month. Section title "Trends" / "Тренды".
21. **Public challenge templates**: shareable /challenge/slug pages without auth
