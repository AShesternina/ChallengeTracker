import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { dailyApi, challengesApi, reportsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTaskStore, DailyTask } from "../store/taskStore";
import { useThemeStore } from "../store/themeStore";
import ProgressRing from "../components/ProgressRing";
import Onboarding from "../components/Onboarding";
import { FlameIcon, TargetIcon, CheckIcon } from "../components/Icons";
import { useCategoryStyle } from "../utils/category";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { dark } = useThemeStore();
  const { summary, setSummary, setLoading } = useTaskStore();
  const [challengeCount, setChallengeCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [weekDays, setWeekDays] = useState<{ date: string; rate: number; total: number }[]>([]);

  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;

  useEffect(() => {
    setLoading(true);
    const now = new Date();
    const todayDate = format(now, "yyyy-MM-dd");
    Promise.all([
      dailyApi.today(todayDate),
      challengesApi.my(),
      reportsApi.streak(),
      reportsApi.monthly(now.getFullYear(), now.getMonth() + 1),
    ])
      .then(([daily, challenges, streakData, monthly]) => {
        setSummary(daily.data);
        const active = challenges.data.filter((c: { status: string }) => c.status === "active").length;
        setChallengeCount(active);
        setStreak(streakData.data.current_streak);
        if (active === 0 && !localStorage.getItem("ct_onboarded")) {
          setShowOnboarding(true);
        }
        // last 7 days
        const today = format(now, "yyyy-MM-dd");
        const last7 = monthly.data.days
          .filter((d: any) => d.date <= today)
          .slice(-7)
          .map((d: any) => ({ date: d.date, rate: d.completion_rate, total: d.total }));
        setWeekDays(last7);
      })
      .finally(() => setLoading(false));
  }, []);

  const completionRate =
    summary && summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

  const userName = user?.email?.split("@")[0] || "there";
  const todayStr = format(new Date(), "EEEE, d MMMM", { locale: dateLocale });

  const handleOnboardingDone = () => {
    localStorage.setItem("ct_onboarded", "1");
    setShowOnboarding(false);
  };

  return (
    <div className="space-y-4">
      {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-text-tertiary capitalize">{todayStr}</p>
          <h2 className="text-[22px] font-black text-text-primary mt-0.5" style={{ letterSpacing: "-0.4px" }}>
            {t("dashboard.greeting", { name: userName })}
          </h2>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
            style={{ background: "var(--color-warning-bg)" }}>
            <FlameIcon size={14} className="text-warning" />
            <span className="text-[13px] font-black" style={{ color: "var(--color-warning)" }}>
              {streak}
            </span>
          </div>
        )}
      </div>

      {/* Hero progress card */}
      <div className="rounded-xl p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-accent) 0%, #2563eb 100%)" }}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <ProgressRing value={completionRate} size={88} stroke={7} white />
            <span className="absolute inset-0 flex items-center justify-center text-[18px] font-black text-white">
              {completionRate}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[12px] font-medium">{t("dashboard.today_progress")}</p>
            <p className="text-[32px] font-black leading-none mt-0.5">
              {summary?.completed ?? 0}<span className="text-[18px] font-bold text-white/60">/{summary?.total ?? 0}</span>
            </p>
            <p className="text-[12px] text-white/70 mt-1">
              {summary?.pending ?? 0} {t("dashboard.remaining")}
            </p>
          </div>
        </div>
        {/* decorative blob */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10"
          style={{ background: "white" }} />
        <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full opacity-10"
          style={{ background: "white" }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          label={t("dashboard.active")}
          value={challengeCount}
          Icon={<TargetIcon size={16} strokeWidth={2} className="text-accent" />}
          color="var(--color-accent-soft)"
        />
        <StatCard
          label={t("dashboard.completed")}
          value={summary?.completed ?? 0}
          Icon={<CheckIcon size={16} strokeWidth={2.5} className="text-success" />}
          color="var(--color-success-bg)"
        />
        <StatCard
          label={t("dashboard.skipped")}
          value={summary?.skipped ?? 0}
          Icon={<FlameIcon size={16} strokeWidth={2} className="text-warning" />}
          color="var(--color-warning-bg)"
        />
      </div>

      {/* Weekly chart */}
      {weekDays.length > 0 && weekDays.some((d) => d.total > 0) && (
        <WeekChart days={weekDays} />
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/daily"
          className="flex items-center justify-center py-3 rounded-md text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-accent)" }}>
          {t("dashboard.today_tasks")}
        </Link>
        <Link to="/challenges/new"
          className="flex items-center justify-center py-3 rounded-md text-[13px] font-bold transition-colors"
          style={{
            background: "var(--color-surface)",
            border: "1.5px solid var(--color-border-strong)",
            color: "var(--color-text-secondary)",
          }}>
          {t("dashboard.new_challenge")}
        </Link>
      </div>

      {/* Today's tasks preview */}
      {summary && summary.tasks.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-text-secondary mb-2 uppercase tracking-wide">
            {t("dashboard.tasks_today")}
          </h3>
          <div className="space-y-2">
            {summary.tasks.slice(0, 3).map((task) => (
              <MiniTaskRow key={task.id} task={task} dark={dark} />
            ))}
            {summary.tasks.length > 3 && (
              <Link to="/daily"
                className="block text-center text-[12px] font-semibold py-1.5"
                style={{ color: "var(--color-accent)" }}>
                {t("dashboard.view_all", { count: summary.tasks.length })}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, Icon, color }: {
  label: string; value: number; Icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-md p-3 text-center"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-center w-7 h-7 rounded-md mx-auto mb-1.5"
        style={{ background: color }}>
        {Icon}
      </div>
      <p className="text-[18px] font-black text-text-primary leading-none">{value}</p>
      <p className="text-[10px] text-text-tertiary mt-0.5 font-medium">{label}</p>
    </div>
  );
}

const DAY_LABELS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_LABELS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function WeekChart({ days }: {
  days: { date: string; rate: number; total: number }[];
}) {
  const { i18n } = useTranslation();
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="rounded-md px-4 py-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
        {i18n.language.startsWith("ru") ? "Последние 7 дней" : "Last 7 days"}
      </p>
      <div className="flex items-end gap-1.5 h-14">
        {days.map((d) => {
          const isToday = d.date === today;
          const pct = d.total === 0 ? 0 : d.rate;
          const barH = d.total === 0 ? 4 : Math.max(8, Math.round(pct * 52));
          let color: string;
          if (d.total === 0) color = "var(--color-surface2)";
          else if (pct >= 1) color = "var(--color-success)";
          else if (pct >= 0.5) color = "rgba(22,163,74,0.5)";
          else color = "#FED7AA";

          const dayOfWeek = new Date(d.date).getDay();
          const labelIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const label = i18n.language.startsWith("ru")
            ? DAY_LABELS_RU[labelIdx]
            : DAY_LABELS_EN[labelIdx];

          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-sm transition-all"
                style={{
                  height: barH,
                  background: color,
                  boxShadow: isToday ? "0 0 0 2px var(--color-accent)" : "none",
                }} />
              <span className="text-[9px] font-bold"
                style={{ color: isToday ? "var(--color-accent)" : "var(--color-text-tertiary)" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniTaskRow({ task, dark }: { task: DailyTask; dark: boolean }) {
  const { t } = useTranslation();
  const { icon, accent, bg } = useCategoryStyle(task.challenge_title, dark);
  const isDone = task.status === "completed";
  const isSkipped = task.status === "skipped";
  const statusLabel = isDone ? t("daily.status_completed") : isSkipped ? t("daily.status_skipped") : t("daily.status_pending");

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2.5"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-sm"
        style={{ background: isDone ? "var(--color-success-bg)" : bg }}>
        {isDone
          ? <CheckIcon size={13} strokeWidth={2.5} className="text-success" />
          : <span>{icon}</span>}
      </div>
      <p className={`flex-1 text-[13px] font-semibold truncate ${isDone ? "line-through text-text-tertiary" : "text-text-primary"}`}>
        {task.challenge_title}
      </p>
      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
        style={{
          background: isDone ? "var(--color-success-bg)" : isSkipped ? "var(--color-surface2)" : `${accent}18`,
          color: isDone ? "var(--color-success)" : isSkipped ? "var(--color-text-tertiary)" : accent,
        }}>
        {statusLabel}
      </span>
    </div>
  );
}
