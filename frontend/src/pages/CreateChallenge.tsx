import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";

interface Template {
  id: number;
  title: string;
  description: string | null;
  type: string;
  default_duration_days: number;
  tasks_per_day: number;
  icon: string | null;
}

type ChallengeType = "single" | "multi" | "all_day";

export default function CreateChallenge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("single");
  const [duration, setDuration] = useState(30);
  const [tasksPerDay, setTasksPerDay] = useState(1);
  const [taskTimes, setTaskTimes] = useState<string[]>(["07:00"]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    challengesApi.templates().then((r) => setTemplates(r.data));
  }, []);

  const applyTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);
    setDescription(tpl.description || "");
    setType(tpl.type as ChallengeType);
    setDuration(tpl.default_duration_days);
    setTasksPerDay(tpl.tasks_per_day);
    setStep("configure");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const times = type === "all_day" ? null : taskTimes.slice(0, tasksPerDay);
      const { data: challenge } = await challengesApi.create({
        title,
        description: description || null,
        type,
        default_duration_days: duration,
        tasks_per_day: tasksPerDay,
        task_times: times,
      });
      await challengesApi.start(challenge.id, startDate);
      navigate("/challenges");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("create_challenge.failed"));
    } finally {
      setLoading(false);
    }
  };

  if (step === "select") {
    return (
      <div className="space-y-4 pb-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t("create_challenge.title")}</h2>
        </div>

        <button
          onClick={() => { setSelectedTemplate(null); setTitle(""); setStep("configure"); }}
          className="w-full border-2 border-dashed border-primary-300 rounded-xl p-4 text-primary-600 font-medium hover:bg-primary-50 transition-colors"
        >
          {t("create_challenge.from_scratch")}
        </button>

        <h3 className="font-semibold text-gray-700">{t("create_challenge.templates")}</h3>
        <div className="space-y-3">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tpl.icon || "🎯"}</span>
                <div>
                  <p className="font-semibold text-gray-800">{tpl.title}</p>
                  <p className="text-sm text-gray-500">{tpl.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {tpl.default_duration_days} {t("challenges.days")} · {tpl.tasks_per_day}{t("challenges.per_day")}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep("select")} className="text-gray-400 hover:text-gray-600">
          {t("common.back")}
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {selectedTemplate ? t("create_challenge.customize") : t("create_challenge.title")}
        </h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.title_label")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t("create_challenge.title_placeholder")}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.type_label")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["single", "multi", "all_day"] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                className={`py-2 text-sm rounded-lg border transition-colors ${
                  type === tp
                    ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t(`create_challenge.type_${tp}` as any)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.duration_label")}</label>
            <input
              type="number"
              min={1}
              max={365}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {type !== "all_day" && (
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
          )}
        </div>

        {type !== "all_day" && (
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
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("create_challenge.start_date_label")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("create_challenge.submitting") : t("create_challenge.submit")}
        </button>
      </form>
    </div>
  );
}
