import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { dailyApi, challengesApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTaskStore } from "../store/taskStore";
import ProgressRing from "../components/ProgressRing";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { summary, setSummary, setLoading } = useTaskStore();
  const [challengeCount, setChallengeCount] = useState(0);

  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;

  useEffect(() => {
    setLoading(true);
    Promise.all([dailyApi.today(), challengesApi.my()])
      .then(([daily, challenges]) => {
        setSummary(daily.data);
        setChallengeCount(
          challenges.data.filter((c: { status: string }) => c.status === "active").length
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const completionRate =
    summary && summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

  const userName = user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          {t("dashboard.greeting", { name: userName })}
        </h2>
        <p className="text-gray-500">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: dateLocale })}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
        <div className="relative">
          <ProgressRing value={completionRate} size={90} />
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary-600">
            {completionRate}%
          </span>
        </div>
        <div>
          <p className="text-gray-500 text-sm">{t("dashboard.today_progress")}</p>
          <p className="text-2xl font-bold text-gray-800">
            {summary?.completed ?? 0}/{summary?.total ?? 0}
          </p>
          <p className="text-sm text-gray-500">{summary?.pending ?? 0} {t("dashboard.remaining")}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t("dashboard.active")} value={challengeCount} icon="🎯" />
        <StatCard label={t("dashboard.completed")} value={summary?.completed ?? 0} icon="✅" />
        <StatCard label={t("dashboard.skipped")} value={summary?.skipped ?? 0} icon="⏭️" />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">{t("dashboard.quick_actions")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/daily"
            className="bg-primary-600 text-white rounded-xl p-4 font-medium text-center hover:bg-primary-700 transition-colors"
          >
            {t("dashboard.today_tasks")}
          </Link>
          <Link
            to="/challenges/new"
            className="bg-white border-2 border-primary-200 text-primary-600 rounded-xl p-4 font-medium text-center hover:bg-primary-50 transition-colors"
          >
            {t("dashboard.new_challenge")}
          </Link>
        </div>
      </div>

      {summary && summary.tasks.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">{t("dashboard.tasks_today")}</h3>
          <div className="space-y-2">
            {summary.tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{task.challenge_title}</p>
                  {task.scheduled_time && (
                    <p className="text-xs text-gray-400">{task.scheduled_time.slice(0, 5)}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "skipped"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
            {summary.tasks.length > 3 && (
              <Link to="/daily" className="block text-center text-sm text-primary-600 hover:underline pt-1">
                {t("dashboard.view_all", { count: summary.tasks.length })}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
      <p className="text-2xl">{icon}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
