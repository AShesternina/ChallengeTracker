import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, addDays, type Locale } from "date-fns";
import { ru as ruLocale, es as esLocale, ptBR as ptLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { reportsApi, challengesApi, dailyApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ChevronRightIcon, ArrowLeftIcon, CheckIcon, ClockIcon, UndoIcon } from "../components/Icons";
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

const DAY_HEADERS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_HEADERS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

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

  useEffect(() => {
    reportsApi.weekdayPatterns().then(({ data }) => {
      setWeekdayRates(data.rates);
      setWeekdayTotals(data.totals);
    }).catch(() => {});
  }, []);

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
  const dayHeaders = i18n.language.startsWith("ru") ? DAY_HEADERS_RU : DAY_HEADERS_EN;
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
              return (
                <DayTaskRow key={task.id} task={task} dark={dark} lang={i18n.language}
                  loading={actionLoading === task.id}
                  editable={isEditable}
                  onComplete={() => handleTaskAction(task.id, "complete")}
                  onSkip={() => handleTaskAction(task.id, "skip")}
                  onUndo={() => handleTaskAction(task.id, "reset")} />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Main monthly view ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
        {t("reports.title")}
      </h2>

      {/* Month nav */}
      <div className="flex items-center justify-between rounded-md px-4 py-3"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <button onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-surface2"
          style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeftIcon size={15} />
        </button>
        <span className="font-bold text-text-primary capitalize text-[15px]">{monthName}</span>
        <button onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-surface2"
          style={{ color: "var(--color-text-secondary)" }}>
          <ChevronRightIcon size={15} strokeWidth={2.5} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        </div>
      )}

      {report && !loading && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <StatCell label={t("reports.total_tasks")} value={String(report.total_tasks)} color="var(--color-text-primary)" />
            <StatCell label={t("reports.completed")} value={String(report.total_completed)} color="var(--color-success)" />
            <StatCell label={t("reports.rate")}
              value={`${Math.round(report.completion_rate * 100)}%`}
              color="var(--color-accent)" />
          </div>

          {/* Heatmap */}
          <div className="rounded-md p-4"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h3 className="font-bold text-text-primary text-[14px] mb-3">{t("reports.daily_completion")}</h3>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayHeaders.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-text-tertiary pb-0.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {report.days.map((day) => {
                const todayStr = format(new Date(), "yyyy-MM-dd");
                const rate = day.total > 0 ? day.completion_rate : -1;
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
                  bg = "#DBEAFE";
                  textColor = "#60A5FA";
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
                    className="aspect-square rounded-sm flex items-center justify-center transition-transform"
                    style={{
                      background: isToday && !hasData ? "var(--color-surface2)" : bg,
                      boxShadow: isToday ? "0 0 0 3px var(--color-accent)" : "none",
                      cursor: hasData ? "pointer" : "default",
                      transform: "scale(1)",
                      zIndex: isToday ? 1 : "auto",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => { if (hasData) (e.currentTarget as HTMLElement).style.transform = "scale(1.15)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    title={hasData ? `${day.date}: ${Math.round(day.completion_rate * day.total)}/${day.total}` : day.date}>
                    <span className="text-[10px] font-bold" style={{ color: textColor }}>
                      {dayNum}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              <Legend color="var(--color-success)" label={t("reports.legend_100")} />
              <Legend color="rgba(22,163,74,0.45)" label={t("reports.legend_50")} />
              <Legend color="#FED7AA" label={t("reports.legend_less50")} />
              <Legend color="#DBEAFE" label={t("reports.legend_future")} />
              <Legend color="var(--color-surface2)" label={t("reports.legend_none")} />
            </div>
            <p className="text-[10px] text-text-tertiary mt-2">
              {i18n.language.startsWith("ru") ? "Нажми на день чтобы увидеть задачи" : "Tap a day to see tasks"}
            </p>
          </div>

          {/* Weekday patterns */}
          {weekdayRates && (
            <WeekdayPatterns rates={weekdayRates} totals={weekdayTotals} dateLocale={dateLocale} />
          )}

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

function WeekdayPatterns({ rates, totals, dateLocale }: {
  rates: number[];
  totals: number[];
  dateLocale: Locale;
}) {
  const { t } = useTranslation();
  // 2024-01-01 is a Monday — use it to generate locale-aware day abbreviations
  const monday = new Date(2024, 0, 1);
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), "EEE", { locale: dateLocale })
  );
  const hasAnyData = totals.some((n) => n > 0);

  return (
    <div className="rounded-md px-4 py-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <h3 className="font-bold text-text-primary text-[14px] mb-3">{t("reports.weekday_patterns")}</h3>
      {!hasAnyData ? (
        <p className="text-[13px] text-text-tertiary">{t("reports.weekday_no_data")}</p>
      ) : (
        <div className="space-y-2">
          {rates.map((rate, i) => {
            const pct = Math.round(rate * 100);
            const hasData = totals[i] > 0;
            const barColor = !hasData
              ? "var(--color-surface2)"
              : pct >= 80 ? "var(--color-success)"
              : pct >= 50 ? "var(--color-warning)"
              : "var(--color-danger)";
            const textColor = !hasData
              ? "var(--color-text-tertiary)"
              : pct >= 80 ? "var(--color-success)"
              : pct >= 50 ? "var(--color-warning)"
              : "var(--color-danger)";

            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-text-tertiary w-7 shrink-0 capitalize">
                  {dayNames[i]}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
                  {hasData && (
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColor }} />
                  )}
                </div>
                <span className="text-[11px] font-bold w-8 text-right shrink-0" style={{ color: textColor }}>
                  {hasData ? `${pct}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayTaskRow({ task, dark, lang, loading, editable, onComplete, onSkip, onUndo }: {
  task: DayTask; dark: boolean; lang: string; loading: boolean; editable: boolean;
  onComplete: () => void; onSkip: () => void; onUndo: () => void;
}) {
  const { icon, accent, bg } = useCategoryStyle(task.challenge_title, dark);
  const isDone = task.status === "completed";
  const isSkipped = task.status === "skipped";
  const isPending = task.status === "pending";
  const isPaused = task.challenge_status === "paused";
  const isInactive = isPaused;
  const isRu = lang.startsWith("ru");

  return (
    <div className="rounded-md p-3.5 transition-all"
      style={{
        background: isDone ? "var(--color-success-bg)" : isSkipped ? "var(--color-surface2)" : "var(--color-surface)",
        border: `1.5px solid ${isDone ? "var(--color-success-bg)" : isSkipped ? "var(--color-border)" : isInactive ? "var(--color-border)" : `${accent}35`}`,
        opacity: isSkipped || isInactive ? 0.55 : 1,
      }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-base"
          style={{ background: isDone ? "var(--color-success-bg)" : bg }}>
          {isDone ? <CheckIcon size={16} strokeWidth={2.5} className="text-success" /> : <span>{icon}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold truncate ${isDone ? "line-through text-text-tertiary" : "text-text-primary"}`}>
            {translateTemplateName(task.challenge_title, lang)}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {task.scheduled_time && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-text-tertiary">
                <ClockIcon size={10} strokeWidth={2} />
                {task.scheduled_time.slice(0, 5)}
              </span>
            )}
            {task.sequence_number != null && task.total_count != null && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${accent}18`, color: accent }}>
                {task.sequence_number} {isRu ? "из" : "of"} {task.total_count}
              </span>
            )}
            {task.type === "all_day" && task.sequence_number == null && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--color-surface2)", color: "var(--color-text-tertiary)" }}>
                {isRu ? "весь день" : "all day"}
              </span>
            )}
          </div>
        </div>

        {editable && !isInactive && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isPending && (
              <>
                <button onClick={onSkip} disabled={loading}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-sm disabled:opacity-40 transition-colors"
                  style={{ border: "1.5px solid var(--color-border-strong)", color: "var(--color-text-secondary)" }}>
                  {isRu ? "Пропуск" : "Skip"}
                </button>
                <button onClick={onComplete} disabled={loading}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-white rounded-sm disabled:opacity-40"
                  style={{ background: accent }}>
                  {isRu ? "Готово" : "Done"}
                </button>
              </>
            )}
            {!isPending && (
              <button onClick={onUndo} disabled={loading}
                className="p-1.5 rounded-sm text-text-tertiary hover:text-text-secondary transition-colors"
                title={isRu ? "Отменить" : "Undo"}>
                <UndoIcon size={14} />
              </button>
            )}
          </div>
        )}
        {isInactive && (
          <span className="text-[10px] font-bold text-text-tertiary shrink-0">
            {isRu ? "пауза" : "paused"}
          </span>
        )}
      </div>
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

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md px-3 py-3 text-center"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-[20px] font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] text-text-tertiary mt-0.5 font-medium">{label}</p>
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
