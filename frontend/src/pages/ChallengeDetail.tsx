import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";

interface ChallengeInstance {
  id: number;
  challenge: {
    id: number;
    title: string;
    description: string | null;
    type: string;
    tasks_per_day: number;
    task_times: string[] | null;
  };
  start_date: string;
  end_date: string;
  status: string;
}

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;

  const [instance, setInstance] = useState<ChallengeInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasksPerDay, setTasksPerDay] = useState(1);
  const [taskTimes, setTaskTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    challengesApi.getInstance(Number(id))
      .then((r) => {
        setInstance(r.data);
        fillForm(r.data);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [id]);

  const fillForm = (inst: ChallengeInstance) => {
    setTitle(inst.challenge.title);
    setDescription(inst.challenge.description || "");
    setEndDate(inst.end_date);
    setTasksPerDay(inst.challenge.tasks_per_day);
    setTaskTimes(inst.challenge.task_times || []);
  };

  const handleSave = async () => {
    if (!instance) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await challengesApi.updateInstance(instance.id, {
        title,
        description: description || null,
        end_date: endDate,
        tasks_per_day: tasksPerDay,
        task_times: instance.challenge.type !== "all_day" ? taskTimes.slice(0, tasksPerDay) : null,
      });
      setInstance(data);
      fillForm(data);
      setEditing(false);
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!instance || !confirm(t("common.confirm_cancel"))) return;
    await challengesApi.cancel(instance.id);
    navigate("/challenges");
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (!instance) return (
    <div className="text-center py-16 text-gray-400">{error || t("common.error")}</div>
  );

  const { challenge } = instance;
  const isActive = instance.status === "active";
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(instance.end_date).getTime() - Date.now()) / 86400000
  ));
  const totalDays = Math.ceil(
    (new Date(instance.end_date).getTime() - new Date(instance.start_date).getTime()) / 86400000
  ) + 1;
  const daysPassed = totalDays - daysLeft;
  const progress = Math.round((daysPassed / totalDays) * 100);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/challenges" className="text-gray-400 hover:text-gray-600 text-xl">{t("common.back")}</Link>
        <h2 className="text-xl font-bold text-gray-800 flex-1 truncate">
          {editing ? t("create_challenge.customize") : challenge.title}
        </h2>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[instance.status] || "bg-gray-100"}`}>
          {t(`challenges.status_${instance.status}` as any, { defaultValue: instance.status })}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {!editing ? (
        <>
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            {challenge.description && (
              <p className="text-gray-600 text-sm">{challenge.description}</p>
            )}

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span>{daysPassed} / {totalDays} {i18n.language === "ru" ? "дней" : "days"}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label={i18n.language === "ru" ? "Начало" : "Start"} value={format(new Date(instance.start_date), "d MMM yyyy", { locale: dateLocale })} />
              <InfoRow label={i18n.language === "ru" ? "Конец" : "End"} value={format(new Date(instance.end_date), "d MMM yyyy", { locale: dateLocale })} />
              <InfoRow label={i18n.language === "ru" ? "Осталось дней" : "Days left"} value={`${daysLeft} 📅`} />
              <InfoRow label={i18n.language === "ru" ? "Задач в день" : "Tasks/day"} value={`${challenge.tasks_per_day}`} />
              <InfoRow
                label={i18n.language === "ru" ? "Тип" : "Type"}
                value={t(`create_challenge.type_${challenge.type}` as any, { defaultValue: challenge.type })}
              />
              {challenge.task_times && challenge.task_times.length > 0 && (
                <InfoRow
                  label={i18n.language === "ru" ? "Время" : "Times"}
                  value={challenge.task_times.map(t => t.slice(0, 5)).join(", ")}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          {isActive && (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                ✏️ {i18n.language === "ru" ? "Редактировать" : "Edit"}
              </button>
              <Link
                to={`/reports/challenge/${instance.id}`}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-center"
              >
                📊 {t("challenges.report")}
              </Link>
            </div>
          )}
          {isActive && (
            <button
              onClick={handleCancel}
              className="w-full py-2.5 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              {t("challenges.cancel")}
            </button>
          )}
          {!isActive && (
            <Link
              to={`/reports/challenge/${instance.id}`}
              className="block w-full py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              📊 {t("challenges.report")}
            </Link>
          )}
        </>
      ) : (
        /* Edit form */
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.title_label")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.description_label")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.start_date_label").replace("начала", "окончания").replace("Start", "End")}</label>
            <input
              type="date"
              value={endDate}
              min={instance.start_date}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {challenge.type !== "all_day" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.tasks_per_day_label")}</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tasksPerDay}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setTasksPerDay(n);
                    setTaskTimes((prev) => {
                      const copy = [...prev];
                      while (copy.length < n) copy.push("12:00");
                      return copy.slice(0, n);
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("create_challenge.times_label")}</label>
                <div className="space-y-2">
                  {taskTimes.slice(0, tasksPerDay).map((tm, i) => (
                    <input
                      key={i}
                      type="time"
                      value={tm}
                      onChange={(e) =>
                        setTaskTimes((prev) => {
                          const copy = [...prev];
                          copy[i] = e.target.value;
                          return copy;
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setEditing(false); fillForm(instance); setError(""); }}
              className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 text-sm mt-0.5">{value}</p>
    </div>
  );
}
