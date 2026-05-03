import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ArrowLeftIcon, EditIcon, BarChartIcon } from "../components/Icons";

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

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  active:    { bg: "var(--color-success-bg)",  text: "var(--color-success)" },
  paused:    { bg: "var(--color-warning-bg)",  text: "var(--color-warning)" },
  completed: { bg: "var(--color-info-bg)",     text: "var(--color-info)" },
  cancelled: { bg: "var(--color-surface2)",    text: "var(--color-text-tertiary)" },
};

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { dark } = useThemeStore();
  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;

  const [instance, setInstance] = useState<ChallengeInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasksPerDay, setTasksPerDay] = useState(1);
  const [taskTimes, setTaskTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    challengesApi.getInstance(Number(id))
      .then((r) => { setInstance(r.data); fillForm(r.data); })
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
      <div className="w-7 h-7 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
    </div>
  );

  if (!instance) return (
    <div className="text-center py-16 text-text-tertiary">{error || t("common.error")}</div>
  );

  const { challenge } = instance;
  const { icon, accent, bg } = useCategoryStyle(challenge.title, dark);
  const isActive = instance.status === "active";
  const style = STATUS_STYLE[instance.status] ?? STATUS_STYLE.cancelled;

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(instance.end_date).getTime() - Date.now()) / 86400000
  ));
  const totalDays = Math.ceil(
    (new Date(instance.end_date).getTime() - new Date(instance.start_date).getTime()) / 86400000
  ) + 1;
  const daysPassed = totalDays - daysLeft;
  const progress = Math.round((daysPassed / totalDays) * 100);

  const inputClass = "w-full px-4 py-3 rounded-md text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors";
  const inputStyle = { background: "var(--color-surface2)", border: "1.5px solid var(--color-border)" };

  return (
    <div className="space-y-4">
      {/* Back header */}
      <div className="flex items-center gap-2">
        <Link to="/challenges"
          className="flex items-center gap-1 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          <ArrowLeftIcon size={15} />
          {t("common.back")}
        </Link>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-md text-[13px]"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {!editing ? (
        <>
          {/* Hero card */}
          <div className="rounded-xl p-5"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: bg }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h2 className="font-black text-[18px] text-text-primary leading-tight flex-1" style={{ letterSpacing: "-0.3px" }}>
                    {challenge.title}
                  </h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 mt-0.5"
                    style={{ background: style.bg, color: style.text }}>
                    {t(`challenges.status_${instance.status}` as any, { defaultValue: instance.status })}
                  </span>
                </div>
                {challenge.description && (
                  <p className="text-[13px] text-text-secondary mt-0.5">{challenge.description}</p>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-[12px] font-semibold mb-1.5">
                <span className="text-text-secondary">{daysPassed} / {totalDays} {i18n.language === "ru" ? "дней" : "days"}</span>
                <span style={{ color: accent }}>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: accent }} />
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <InfoCell label={i18n.language === "ru" ? "Начало" : "Start"}
                value={format(new Date(instance.start_date), "d MMM yyyy", { locale: dateLocale })} />
              <InfoCell label={i18n.language === "ru" ? "Конец" : "End"}
                value={format(new Date(instance.end_date), "d MMM yyyy", { locale: dateLocale })} />
              <InfoCell label={i18n.language === "ru" ? "Осталось" : "Days left"} value={`${daysLeft} дн.`} />
              <InfoCell label={i18n.language === "ru" ? "Задач/день" : "Tasks/day"} value={`${challenge.tasks_per_day}`} />
              <InfoCell label={i18n.language === "ru" ? "Тип" : "Type"}
                value={t(`create_challenge.type_${challenge.type}` as any, { defaultValue: challenge.type })} />
              {challenge.task_times && challenge.task_times.length > 0 && (
                <InfoCell label={i18n.language === "ru" ? "Время" : "Times"}
                  value={challenge.task_times.map((t) => t.slice(0, 5)).join(", ")} />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            {isActive && (
              <button onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-2 flex-1 py-3 rounded-md text-[13px] font-bold text-white"
                style={{ background: "var(--color-accent)" }}>
                <EditIcon size={14} />
                {i18n.language === "ru" ? "Редактировать" : "Edit"}
              </button>
            )}
            <Link to={`/reports/challenge/${instance.id}`}
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-md text-[13px] font-bold transition-colors"
              style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border-strong)", color: "var(--color-text-secondary)" }}>
              <BarChartIcon size={14} />
              {t("challenges.report")}
            </Link>
          </div>

          {isActive && (
            <button onClick={handleCancel}
              className="w-full py-2.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{ border: "1.5px solid var(--color-danger)", color: "var(--color-danger)" }}>
              {t("challenges.cancel")}
            </button>
          )}
        </>
      ) : (
        /* Edit form */
        <div className="rounded-xl p-5 space-y-4"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-bold text-text-primary text-[16px]">{t("create_challenge.customize")}</h3>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
              {t("create_challenge.title_label")}
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className={inputClass} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
              {t("create_challenge.description_label")}
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} className={inputClass + " resize-none"} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
              {i18n.language === "ru" ? "Дата окончания" : "End date"}
            </label>
            <input type="date" value={endDate} min={instance.start_date}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </div>

          {challenge.type !== "all_day" && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                  {t("create_challenge.tasks_per_day_label")}
                </label>
                <input type="number" min={1} max={10} value={tasksPerDay}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setTasksPerDay(n);
                    setTaskTimes((prev) => {
                      const copy = [...prev];
                      while (copy.length < n) copy.push("12:00");
                      return copy.slice(0, n);
                    });
                  }}
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
              </div>
              <div className="space-y-2">
                {taskTimes.slice(0, tasksPerDay).map((tm, i) => (
                  <input key={i} type="time" value={tm}
                    onChange={(e) => setTaskTimes((prev) => {
                      const copy = [...prev]; copy[i] = e.target.value; return copy;
                    })}
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2.5 pt-1">
            <button onClick={() => { setEditing(false); fillForm(instance); setError(""); }}
              className="flex-1 py-3 rounded-md text-[13px] font-bold transition-colors"
              style={{ border: "1.5px solid var(--color-border-strong)", color: "var(--color-text-secondary)" }}>
              {t("common.cancel")}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-md text-[13px] font-bold text-white disabled:opacity-50 transition-opacity"
              style={{ background: "var(--color-accent)" }}>
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md px-3 py-2.5" style={{ background: "var(--color-surface2)" }}>
      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide">{label}</p>
      <p className="font-bold text-text-primary text-[13px] mt-0.5">{value}</p>
    </div>
  );
}
