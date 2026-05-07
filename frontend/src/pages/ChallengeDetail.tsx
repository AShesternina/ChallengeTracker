import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { challengesApi, reportsApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ArrowLeftIcon, EditIcon, BarChartIcon, FlameIcon, TrophyIcon } from "../components/Icons";
import ConfirmModal from "../components/ConfirmModal";

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
  const [streaks, setStreaks] = useState<{ current: number; longest: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPastEndModal, setShowPastEndModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasksPerDay, setTasksPerDay] = useState(1);
  const [taskTimes, setTaskTimes] = useState<string[]>([]);
  const [type, setType] = useState<"single" | "multi" | "all_day">("single");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      challengesApi.getInstance(Number(id)),
      reportsApi.challenge(Number(id)),
    ])
      .then(([instRes, repRes]) => {
        setInstance(instRes.data);
        fillForm(instRes.data);
        setStreaks({ current: repRes.data.current_streak, longest: repRes.data.longest_streak });
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [id]);

  const fillForm = (inst: ChallengeInstance) => {
    setTitle(inst.challenge.title);
    setDescription(inst.challenge.description || "");
    setStartDate(inst.start_date);
    setEndDate(inst.end_date);
    setTasksPerDay(inst.challenge.tasks_per_day);
    setTaskTimes(inst.challenge.task_times || []);
    setType(inst.challenge.type as "single" | "multi" | "all_day");
  };

  const doSave = async () => {
    if (!instance) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await challengesApi.updateInstance(instance.id, {
        title,
        description: description || null,
        start_date: startDate,
        end_date: endDate,
        tasks_per_day: tasksPerDay,
        task_times: type !== "all_day" ? taskTimes.slice(0, tasksPerDay) : null,
        type,
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

  const handleSave = async () => {
    if (!instance) return;
    const today = new Date().toISOString().slice(0, 10);
    if (endDate < today) {
      setShowPastEndModal(true);
      return;
    }
    await doSave();
  };

  const handleSaveConfirmed = async () => {
    setShowPastEndModal(false);
    await doSave();
  };

  const handlePause = async () => {
    if (!instance) return;
    try {
      const { data } = await challengesApi.pause(instance.id);
      setInstance(data);
    } catch (e: any) {
      setError(e.response?.data?.detail || t("common.error"));
    }
  };

  const handleResume = async () => {
    if (!instance) return;
    try {
      const { data } = await challengesApi.resume(instance.id);
      setInstance(data);
    } catch (e: any) {
      setError(e.response?.data?.detail || t("common.error"));
    }
  };

  const handleRestore = async () => {
    if (!instance) return;
    try {
      const { data } = await challengesApi.restore(instance.id);
      setInstance(data);
      fillForm(data);
    } catch (e: any) {
      setError(e.response?.data?.detail || t("common.error"));
    }
  };


  const handleDelete = async () => {
    if (!instance) return;
    try {
      await challengesApi.deletePermanently(instance.id);
      navigate("/challenges");
    } catch (e: any) {
      setError(e.response?.data?.detail || t("common.error"));
    }
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
                <span className="text-text-secondary">{daysPassed} / {totalDays} {t("detail.days_of")}</span>
                <span style={{ color: accent }}>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: accent }} />
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <InfoCell label={t("detail.start")}
                value={format(new Date(instance.start_date), "d MMM yyyy", { locale: dateLocale })} />
              <InfoCell label={t("detail.end")}
                value={format(new Date(instance.end_date), "d MMM yyyy", { locale: dateLocale })} />
              <InfoCell label={t("detail.days_left")} value={`${daysLeft} ${t("challenges.days_abbr")}`} />
              <InfoCell label={t("detail.tasks_per_day")} value={`${challenge.tasks_per_day}`} />
              <InfoCell label={t("detail.type")}
                value={t(`create_challenge.type_${challenge.type}` as any, { defaultValue: challenge.type })} />
              {challenge.task_times && challenge.task_times.length > 0 && (
                <InfoCell label={t("detail.times")}
                  value={challenge.task_times.map((tm) => tm.slice(0, 5)).join(", ")} />
              )}
            </div>

            {/* Streak row */}
            {streaks && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-md px-3 py-2.5 flex items-center gap-2"
                  style={{ background: "var(--color-warning-bg)" }}>
                  <FlameIcon size={16} className="text-warning shrink-0" />
                  <div>
                    <p className="text-[18px] font-black" style={{ color: "var(--color-warning)" }}>
                      {streaks.current}
                    </p>
                    <p className="text-[10px] font-semibold text-text-tertiary">
                      {t("detail.streak")}
                    </p>
                  </div>
                </div>
                <div className="rounded-md px-3 py-2.5 flex items-center gap-2"
                  style={{ background: "var(--color-accent-soft)" }}>
                  <TrophyIcon size={16} className="text-accent shrink-0" />
                  <div>
                    <p className="text-[18px] font-black text-accent">{streaks.longest}</p>
                    <p className="text-[10px] font-semibold text-text-tertiary">
                      {t("detail.best")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            {(isActive || instance.status === "paused") && (
              <button onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-2 flex-1 py-3 rounded-md text-[13px] font-bold text-white"
                style={{ background: "var(--color-accent)" }}>
                <EditIcon size={14} />
                {t("challenges.edit")}
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
            <button onClick={handlePause}
              className="w-full py-2.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{ border: "1.5px solid var(--color-border-strong)", color: "var(--color-text-secondary)" }}>
              ⏸ {t("challenges.pause")}
            </button>
          )}

          {instance.status === "paused" && (
            <button onClick={handleResume}
              className="w-full py-2.5 rounded-md text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--color-success)" }}>
              ▶ {t("challenges.resume")}
            </button>
          )}


          <button onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{ border: "1.5px solid var(--color-danger)", color: "var(--color-danger)" }}>
              {t("challenges.delete_permanently")}
            </button>

          {showDeleteModal && (
            <ConfirmModal
              emoji="🗑️"
              title={t("challenges.confirm_delete")}
              body={t("challenges.confirm_delete_body")}
              confirmLabel={t("challenges.confirm_delete_yes")}
              cancelLabel={t("challenges.confirm_delete_no")}
              onConfirm={handleDelete}
              onCancel={() => setShowDeleteModal(false)}
            />
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

          {/* Type */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
              {t("create_challenge.type_label")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["single", "multi", "all_day"] as const).map((tp) => (
                <button key={tp} type="button" onClick={() => setType(tp)}
                  className="py-2.5 text-[12px] font-bold rounded-md transition-colors"
                  style={{
                    border: `1.5px solid ${type === tp ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: type === tp ? "var(--color-accent-soft)" : "var(--color-surface2)",
                    color: type === tp ? "var(--color-accent)" : "var(--color-text-secondary)",
                  }}>
                  {t(`create_challenge.type_${tp}` as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
              {t("create_challenge.start_date_label")}
            </label>
            <input type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </div>

          {/* End date */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
              {t("detail.end_date")}
            </label>
            <input type="date" value={endDate} min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </div>

          {type !== "all_day" && (
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

      {showPastEndModal && (
        <ConfirmModal
          emoji="📅"
          title={t("common.confirm_past_end")}
          body={t("common.confirm_past_end_body")}
          confirmLabel={t("common.confirm_past_end_yes")}
          cancelLabel={t("common.confirm_past_end_no")}
          confirmDanger={false}
          onConfirm={handleSaveConfirmed}
          onCancel={() => setShowPastEndModal(false)}
        />
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
