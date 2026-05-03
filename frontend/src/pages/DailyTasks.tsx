import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { dailyApi } from "../services/api";
import { useTaskStore } from "../store/taskStore";
import TaskCard from "../components/TaskCard";

export default function DailyTasks() {
  const { t, i18n } = useTranslation();
  const { summary, setSummary, setLoading, loading, updateTask } = useTaskStore();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;

  useEffect(() => {
    setLoading(true);
    dailyApi
      .today()
      .then((r) => setSummary(r.data))
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await dailyApi.complete(id);
      updateTask(data);
    } catch {
      setError(t("daily.action_failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await dailyApi.skip(id);
      updateTask(data);
    } catch {
      setError(t("daily.action_failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUndo = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await dailyApi.reset(id);
      updateTask(data);
    } catch {
      setError(t("daily.action_failed"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const pending = summary?.tasks.filter((t) => t.status === "pending") ?? [];
  const done = summary?.tasks.filter((t) => t.status !== "pending") ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[12px] font-medium text-text-tertiary capitalize">
          {format(new Date(), "EEEE, d MMMM", { locale: dateLocale })}
        </p>
        <h2 className="text-[22px] font-black text-text-primary mt-0.5" style={{ letterSpacing: "-0.4px" }}>
          {t("daily.title")}
        </h2>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-md text-[13px]"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.total > 0 && (
        <div className="rounded-md px-4 py-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex justify-between text-[12px] font-semibold mb-2">
            <span className="text-text-secondary">{t("daily.progress")}</span>
            <span className="text-text-primary">{summary.completed}/{summary.total}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(summary.completed / summary.total) * 100}%`,
                background: "var(--color-accent)",
              }}
            />
          </div>
        </div>
      )}

      {/* Empty states */}
      {summary?.total === 0 && (
        <div className="text-center py-14">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-bold text-text-primary">{t("daily.no_tasks")}</p>
          <p className="text-[13px] text-text-tertiary mt-1">{t("daily.no_tasks_hint")}</p>
        </div>
      )}

      {pending.length === 0 && (summary?.total ?? 0) > 0 && (
        <div className="text-center py-10 rounded-md"
          style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
          <p className="text-3xl mb-2">✅</p>
          <p className="font-bold text-success">{t("daily.all_done")}</p>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
            {t("daily.pending_label", { count: pending.length })}
          </p>
          {pending.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onUndo={handleUndo}
              loading={actionLoading === task.id}
            />
          ))}
        </div>
      )}

      {/* Completed / skipped tasks */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
            {t("daily.done_label", { count: done.length })}
          </p>
          {done.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onUndo={handleUndo}
              loading={actionLoading === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
