import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { reportsApi } from "../services/api";
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

const DAY_HEADERS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_HEADERS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function Reports() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await reportsApi.monthly(year, month);
      setReport(data);
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
                    className="aspect-square rounded-sm flex items-center justify-center relative"
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
        </>
      )}
    </div>
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
