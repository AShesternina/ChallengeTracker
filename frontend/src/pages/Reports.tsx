import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, es as esLocale, ptBR as ptLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { reportsApi, challengesApi, dailyApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ChevronRightIcon, ArrowLeftIcon } from "../components/Icons";
import TaskCard from "../components/TaskCard";
import { translateTemplateName } from "../utils/templateTranslations";

interface DayStats {
  date: string;
  total: number;
  completed: number;
  completion_rate: number;
}

interface MonthlyReport {
  year: number;
  month: number;
  days: DayStats[];
  total_tasks: number;
  total_completed: number;
  completion_rate: number;
}

interface ChallengeInstance {
  id: number;
  challenge: { title: string };
  start_date: string;
  end_date: string;
  status: string;
}

interface DayTask {
  id: number;
  challenge_title: string;
  scheduled_time: string | null;
  type: string;
  status: "pending" | "completed" | "skipped";
  sequence_number: number | null;
  total_count: number | null;
  challenge_status: string;
}

// Heatmap column headers (compact)
const DAY_HEADERS: Record<string, string[]> = {
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  es: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
  pt: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
};

// Day abbreviations used in insight sentences
const INSIGHT_DAY_NAMES: Record<string, string[]> = {
  ru: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  es: ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"],
  pt: ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
};

export default function Reports() {
  const { t, i18n } = useTranslation();
  const { dark } = useThemeStore();
  const dateLocale = i18n.language.startsWith("ru") ? ruLocale
    : i18n.language.startsWith("es") ? esLocale
    : i18n.language.startsWith("pt") ? ptLocale
    : enUS;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [challenges, setChallenges] = useState<ChallengeInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekdayRates, setWeekdayRates] = useState<number[] | null>(null);
  const [weekdayTotals, setWeekdayTotals] = useState<number[]>([]);
  const [momentumData, setMomentumData] = useState<{ trend: string } | null>(null);
  const [streakData, setStreakData] = useState<{ current_streak: number } | null>(null);

  // Day drill-down
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null);
  const [dayTasks, setDayTasks] = useState<DayTask[]>([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data }, { data: ch }] = await Promise.all([
        reportsApi.monthly(year, month),
        challengesApi.my(),
      ]);
      setReport(data);
      setChallenges(ch.filter((c: ChallengeInstance) => c.status === "active"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]);

  const loadAnalytics = () => {
    Promise.all([
      reportsApi.weekdayPatterns(),
      reportsApi.momentum(),
      reportsApi.streak(),
    ]).then(([wpRes, momRes, strRes]) => {
      setWeekdayRates(wpRes.data.rates);
      setWeekdayTotals(wpRes.data.totals);
      setMomentumData({ trend: momRes.data.trend });
      setStreakData({ current_streak: strRes.data.current_streak });
    }).catch(() => {});
  };

  useEffect(() => { loadAnalytics(); }, []);

  const handleDayClick = async (day: DayStats) => {
    if (day.total === 0) return;
    setSelectedDay(day);
    setDayLoading(true);
    try {
      const { data } = await dailyApi.today(day.date);
      setDayTasks(data.tasks);
    } finally {
      setDayLoading(false);
    }
  };

  const handleTaskAction = async (id: number, action: "complete" | "skip" | "reset") => {
    setActionLoading(id);
    try {
      const { data } = await (
        action === "complete" ? dailyApi.complete(id) :
        action === "skip" ? dailyApi.skip(id) :
        dailyApi.reset(id)
      );
      setDayTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
      // refresh day stats in report
      if (selectedDay && report) {
        const completed = action === "complete"
          ? selectedDay.completed + 1
          : action === "reset" ? Math.max(0, selectedDay.completed - 1)
          : selectedDay.completed;
        const updated = { ...selectedDay, completed, completion_rate: selectedDay.total > 0 ? completed / selectedDay.total : 0 };
        setSelectedDay(updated);
        setReport((r) => r ? {
          ...r,
          days: r.days.map((d) => d.date === selectedDay.date ? updated : d),
        } : r);
      }
      loadAnalytics();
    } finally {
      setActionLoading(null);
    }
  };

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const monthName = format(new Date(year, month - 1), "LLLL yyyy", { locale: dateLocale });
  const langKey = i18n.language.startsWith("ru") ? "ru"
    : i18n.language.startsWith("es") ? "es"
    : i18n.language.startsWith("pt") ? "pt"
    : "en";
  const dayHeaders = DAY_HEADERS[langKey];
  const startOffset = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  // ── Day detail view ──────────────────────────────────────────────────────
  if (selectedDay) {
    const d = selectedDay;
    const dateObj = new Date(d.date);
    const dateLabel = format(dateObj, "d MMMM yyyy", { locale: dateLocale });
    const rate = d.total > 0 ? Math.round(d.completion_rate * 100) : 0;
    const completed = Math.round(d.completion_rate * d.total);
    const today = format(new Date(), "yyyy-MM-dd");
    const isFuture = d.date > today;

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedDay(null)}
          className="flex items-center gap-1 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          <ArrowLeftIcon size={15} />
          {t("reports.title")}
        </button>

        {/* Day header */}
        <div className="rounded-xl p-4"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[12px] font-medium text-text-tertiary capitalize">{dateLabel}</p>
            {isFuture && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>
                {i18n.language.startsWith("ru") ? "Будущее · только просмотр" : "Future · read only"}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[20px] font-black text-text-primary"
              style={{ letterSpacing: "-0.3px" }}>
              {isFuture ? `0/${d.total}` : `${completed}/${d.total}`} {i18n.language.startsWith("ru") ? "задач" : "tasks"}
            </p>
            <span className="text-[13px] font-black px-2.5 py-1 rounded-full"
              style={{
                background: rate >= 100 ? "var(--color-success-bg)" : rate >= 50 ? "var(--color-warning-bg)" : "var(--color-danger-bg)",
                color: rate >= 100 ? "var(--color-success)" : rate >= 50 ? "var(--color-warning)" : "var(--color-danger)",
              }}>
              {rate}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${rate}%`,
                background: rate >= 100 ? "var(--color-success)" : rate >= 50 ? "var(--color-warning)" : "var(--color-danger)",
              }} />
          </div>
        </div>

        {dayLoading && (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!dayLoading && dayTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
              {i18n.language.startsWith("ru") ? "Задачи" : "Tasks"}
            </p>
            {dayTasks.map((task) => {
              const isEditable = !isFuture && task.challenge_status !== "paused";
              const dailyTask = {
                ...task,
                type: task.type as "single" | "multi" | "all_day",
                challenge_instance_id: 0,
                date: d.date,
                completed_at: null,
              };
              return (
                <TaskCard key={task.id} task={dailyTask}
                  readOnly={!isEditable}
                  loading={actionLoading === task.id}
                  onComplete={isEditable ? () => handleTaskAction(task.id, "complete") : undefined}
                  onSkip={isEditable ? () => handleTaskAction(task.id, "skip") : undefined}
                  onUndo={isEditable ? () => handleTaskAction(task.id, "reset") : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Main monthly view ────────────────────────────────────────────────────
  const insightDayNames = INSIGHT_DAY_NAMES[langKey];
  const insights = weekdayRates
    ? generateInsights(weekdayRates, weekdayTotals, momentumData, streakData, insightDayNames, t)
    : [];
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-4">
      <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
        {t("reports.title")}
      </h2>

      {/* Month header card — nav + stats combined */}
      <div className="rounded-md px-4 pt-3 pb-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

        {/* Navigation row */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} aria-label={t("reports.prev_month")}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--color-text-secondary)" }}>
            <ArrowLeftIcon size={15} />
          </button>
          <span className="font-bold text-text-primary capitalize text-[15px]">{monthName}</span>
          <button onClick={nextMonth} aria-label={t("reports.next_month")}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--color-text-secondary)" }}>
            <ChevronRightIcon size={15} strokeWidth={2.5} />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
          </div>
        )}

        {report && !loading && (() => {
          const rate = Math.round(report.completion_rate * 100);
          const barColor = rate >= 80 ? "var(--color-success)" : rate >= 50 ? "var(--color-warning)" : rate > 0 ? "var(--color-danger)" : "var(--color-surface2)";
          const rateColor = rate >= 80 ? "var(--color-success)" : rate >= 50 ? "var(--color-warning)" : rate > 0 ? "var(--color-danger)" : "var(--color-text-tertiary)";
          return (
            <>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: "var(--color-surface2)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${rate}%`, background: barColor }} />
              </div>
              {/* Stats row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-text-tertiary">
                    <span className="font-bold text-text-primary">{report.total_tasks}</span> {t("reports.total_tasks").toLowerCase()}
                  </span>
                  <span className="text-text-tertiary text-[10px]">·</span>
                  <span className="text-[12px] text-text-tertiary">
                    <span className="font-bold" style={{ color: "var(--color-success)" }}>{report.total_completed}</span> {t("reports.completed").toLowerCase()}
                  </span>
                </div>
                <span className="text-[20px] font-black" style={{ color: rateColor, letterSpacing: "-0.5px" }}>
                  {rate}%
                </span>
              </div>
            </>
          );
        })()}
      </div>

      {report && !loading && (
        <>
          {/* Heatmap */}
          <div className="rounded-md p-4"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h3 className="font-bold text-text-primary text-[14px] mb-3">{t("reports.daily_completion")}</h3>

            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {dayHeaders.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-text-tertiary">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {report.days.map((day) => {
                const todayStr = format(new Date(), "yyyy-MM-dd");
                const rate = day.total > 0 ? day.completion_rate : -1;
                const pct = rate >= 0 ? Math.round(rate * 100) : null;
                const dayNum = Number(day.date.split("-")[2]);
                const isToday = day.date === todayStr;
                const isFutureDay = day.date > todayStr;
                const hasData = day.total > 0;

                let bg: string;
                let textColor: string;
                if (rate < 0) {
                  bg = "var(--color-surface2)";
                  textColor = "var(--color-text-tertiary)";
                } else if (isFutureDay) {
                  bg = "var(--color-info-bg)";
                  textColor = "var(--color-info)";
                } else if (rate >= 1) {
                  bg = "var(--color-success)";
                  textColor = "white";
                } else if (rate >= 0.5) {
                  bg = "rgba(22,163,74,0.45)";
                  textColor = "white";
                } else {
                  bg = "#FED7AA";
                  textColor = "#C2410C";
                }

                return (
                  <button
                    key={day.date}
                    onClick={() => handleDayClick(day)}
                    disabled={!hasData}
                    className="rounded-md flex flex-col items-center justify-center transition-transform py-1.5 gap-0.5"
                    style={{
                      minHeight: "44px",
                      background: isToday && !hasData ? "var(--color-surface2)" : bg,
                      boxShadow: isToday ? "0 0 0 2px var(--color-accent)" : "none",
                      cursor: hasData ? "pointer" : "default",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => { if (hasData) (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    title={hasData ? `${day.date}: ${Math.round(day.completion_rate * day.total)}/${day.total}` : day.date}>
                    <span className="text-[13px] font-bold leading-none" style={{ color: textColor }}>
                      {dayNum}
                    </span>
                    {hasData && !isFutureDay && pct !== null && (
                      <span className="text-[9px] font-semibold leading-none opacity-90" style={{ color: textColor }}>
                        {pct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              <Legend color="var(--color-success)" label={t("reports.legend_100")} />
              <Legend color="rgba(22,163,74,0.45)" label={t("reports.legend_50")} />
              <Legend color="#FED7AA" label={t("reports.legend_less50")} />
              <Legend color="var(--color-info-bg)" label={t("reports.legend_future")} />
              <Legend color="var(--color-surface2)" label={t("reports.legend_none")} />
            </div>
            <p className="text-[10px] text-text-tertiary mt-2">{t("reports.tap_day_hint")}</p>
          </div>

          {/* Smart insights — only for current month */}
          {isCurrentMonth && insights.length > 0 && <InsightsCard insights={insights} />}

          {/* Active challenges list */}
          {challenges.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                {t("reports.active_challenges")}
              </p>
              <div className="space-y-2">
                {challenges.map((ch) => (
                  <ChallengeRow key={ch.id} instance={ch} dark={dark} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}



function ChallengeRow({ instance, dark }: { instance: ChallengeInstance; dark: boolean }) {
  const { i18n } = useTranslation();
  const { icon, accent, bg } = useCategoryStyle(instance.challenge.title, dark);
  const totalDays = Math.ceil(
    (new Date(instance.end_date).getTime() - new Date(instance.start_date).getTime()) / 86400000
  ) + 1;
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(instance.end_date).getTime() - Date.now()) / 86400000
  ));
  const progress = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  return (
    <Link to={`/reports/challenge/${instance.id}`}
      className="flex items-center gap-3 rounded-md px-4 py-3 transition-all hover:shadow-md"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="w-8 h-8 rounded-md flex items-center justify-center text-base shrink-0"
        style={{ background: bg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-primary text-[13px] truncate">{translateTemplateName(instance.challenge.title, i18n.language)}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: accent }} />
          </div>
          <span className="text-[10px] font-bold shrink-0" style={{ color: accent }}>{progress}%</span>
        </div>
      </div>
      <ChevronRightIcon size={14} className="text-text-tertiary shrink-0" />
    </Link>
  );
}

interface Insight {
  emoji: string;
  text: string;
  type: "positive" | "neutral" | "warning";
}

function generateInsights(
  weekdayRates: number[],
  weekdayTotals: number[],
  momentum: { trend: string } | null,
  streak: { current_streak: number } | null,
  dayNames: string[],
  t: (key: string, opts?: Record<string, unknown>) => string
): Insight[] {
  const insights: Insight[] = [];
  const valid = weekdayRates
    .map((rate, i) => ({ rate, total: weekdayTotals[i], i }))
    .filter((d) => d.total >= 1);

  if (valid.length < 2) return [];

  const best = valid.reduce((a, b) => (a.rate > b.rate ? a : b));
  const worst = valid.reduce((a, b) => (a.rate < b.rate ? a : b));

  if (best.rate >= 0.6) {
    const bestRate = Math.round(best.rate * 100);
    const tied = valid.filter((d) => Math.round(d.rate * 100) === bestRate);
    insights.push({
      emoji: "🌟",
      text: tied.length > 1
        ? t("insights.best_days", { days: tied.map((d) => dayNames[d.i]).join(", "), rate: bestRate })
        : t("insights.best_day", { day: dayNames[best.i], rate: bestRate }),
      type: "positive",
    });
  }

  if (best.i !== worst.i && best.rate - worst.rate > 0.2 && worst.rate < 0.5) {
    insights.push({
      emoji: "💪",
      text: t("insights.worst_day", { day: dayNames[worst.i], rate: Math.round(worst.rate * 100) }),
      type: "warning",
    });
  }

  const weekendDays = valid.filter((d) => d.i >= 5);
  const weekdayDays = valid.filter((d) => d.i < 5);
  if (weekendDays.length >= 2 && weekdayDays.length >= 3) {
    const avgWe = weekendDays.reduce((s, d) => s + d.rate, 0) / weekendDays.length;
    const avgWd = weekdayDays.reduce((s, d) => s + d.rate, 0) / weekdayDays.length;
    if (Math.abs(avgWe - avgWd) > 0.15) {
      insights.push({
        emoji: avgWe > avgWd ? "🏖️" : "💼",
        text: t(avgWe > avgWd ? "insights.weekends_easier" : "insights.weekdays_easier"),
        type: "neutral",
      });
    }
  }

  if (momentum?.trend === "up") {
    insights.push({ emoji: "📈", text: t("insights.momentum_up"), type: "positive" });
  } else if (momentum?.trend === "down") {
    insights.push({ emoji: "📉", text: t("insights.momentum_down"), type: "neutral" });
  }

  if (streak && streak.current_streak >= 7) {
    insights.push({
      emoji: "🔥",
      text: t("insights.streak_going", { n: streak.current_streak }),
      type: "positive",
    });
  }

  if (valid.length >= 5) {
    const mean = valid.reduce((s, d) => s + d.rate, 0) / valid.length;
    const stdDev = Math.sqrt(valid.reduce((s, d) => s + Math.pow(d.rate - mean, 2), 0) / valid.length);
    if (stdDev < 0.1) {
      insights.push({ emoji: "⚡", text: t("insights.consistent"), type: "positive" });
    } else if (stdDev > 0.25) {
      insights.push({ emoji: "🌊", text: t("insights.variable"), type: "neutral" });
    }
  }

  return insights.slice(0, 4);
}

function InsightsCard({ insights }: { insights: Insight[] }) {
  const { t } = useTranslation();
  const borderColor = { positive: "var(--color-success)", neutral: "var(--color-accent)", warning: "var(--color-warning)" };
  const bgColor = { positive: "var(--color-success-bg)", neutral: "var(--color-info-bg)", warning: "var(--color-warning-bg)" };

  return (
    <div className="rounded-md px-4 py-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <h3 className="font-bold text-text-primary text-[14px] mb-3">{t("insights.title")}</h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2"
            style={{ background: bgColor[insight.type], borderLeft: `3px solid ${borderColor[insight.type]}` }}>
            <span className="text-base shrink-0">{insight.emoji}</span>
            <p className="text-[13px] font-semibold text-text-primary">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
      <span className="w-3 h-3 rounded-sm inline-block shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}
