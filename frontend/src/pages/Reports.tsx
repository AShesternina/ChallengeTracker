import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { reportsApi, challengesApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ChevronRightIcon, ArrowLeftIcon } from "../components/Icons";

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

const DAY_HEADERS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_HEADERS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function Reports() {
  const { t, i18n } = useTranslation();
  const { dark } = useThemeStore();
  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [challenges, setChallenges] = useState<ChallengeInstance[]>([]);
  const [loading, setLoading] = useState(false);

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

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const monthName = format(new Date(year, month - 1), "LLLL yyyy", { locale: dateLocale });
  const dayHeaders = i18n.language === "ru" ? DAY_HEADERS_RU : DAY_HEADERS_EN;
  const startOffset = (new Date(year, month - 1, 1).getDay() + 6) % 7;

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
                const rate = day.total > 0 ? day.completion_rate : -1;
                const dayNum = Number(day.date.split("-")[2]);
                const isToday = day.date === format(new Date(), "yyyy-MM-dd");

                let bg: string;
                if (rate < 0) bg = "var(--color-surface2)";
                else if (rate >= 1) bg = "var(--color-success)";
                else if (rate >= 0.5) bg = "rgba(22,163,74,0.45)";
                else bg = "var(--color-danger-bg)";

                return (
                  <div key={day.date}
                    className="aspect-square rounded-sm flex items-center justify-center"
                    style={{ background: bg, outline: isToday ? "2px solid var(--color-accent)" : "none" }}
                    title={`${day.date}: ${day.completed}/${day.total}`}>
                    <span className="text-[10px] font-bold"
                      style={{ color: rate >= 0.5 ? "white" : "var(--color-text-tertiary)" }}>
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              <Legend color="var(--color-success)" label={t("reports.legend_100")} />
              <Legend color="rgba(22,163,74,0.45)" label={t("reports.legend_50")} />
              <Legend color="var(--color-danger-bg)" label={t("reports.legend_less50")} />
              <Legend color="var(--color-surface2)" label={t("reports.legend_none")} />
            </div>
          </div>

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

function ChallengeRow({ instance, dark }: {
  instance: ChallengeInstance; dark: boolean;
}) {
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
        <p className="font-bold text-text-primary text-[13px] truncate">{instance.challenge.title}</p>
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
