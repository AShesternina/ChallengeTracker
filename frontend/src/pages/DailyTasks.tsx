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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t("daily.title")}</h2>
        <p className="text-gray-500">
          {format(new Date(), "EEEE, d MMMM", { locale: dateLocale })}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {summary && summary.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{t("daily.progress")}</span>
            <span>{summary.completed}/{summary.total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${(summary.completed / summary.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {summary?.tasks.filter((t) => t.status === "pending").length === 0 &&
        summary?.total === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">🎉</p>
            <p className="font-medium">{t("daily.no_tasks")}</p>
            <p className="text-sm">{t("daily.no_tasks_hint")}</p>
          </div>
        )}

      {summary?.tasks.filter((t) => t.status === "pending").length === 0 &&
        (summary?.total ?? 0) > 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-medium text-gray-600">{t("daily.all_done")}</p>
          </div>
        )}

      <div className="space-y-3">
        {summary?.tasks
          .filter((t) => t.status === "pending")
          .map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onSkip={handleSkip}
              loading={actionLoading === task.id}
            />
          ))}
        {summary?.tasks
          .filter((t) => t.status !== "pending")
          .map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onSkip={handleSkip}
              loading={actionLoading === task.id}
            />
          ))}
      </div>
    </div>
  );
}
