import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ArrowLeftIcon } from "../components/Icons";
import ConfirmModal from "../components/ConfirmModal";
import { translateTemplateName, translateTemplateDesc, CATEGORY_ORDER, TEMPLATE_CATEGORY_MAP, translateCategoryLabel } from "../utils/templateTranslations";

interface Template {
  id: number;
  title: string;
  description: string | null;
  type: string;
  default_duration_days: number;
  tasks_per_day: number;
  icon: string | null;
}

type UIType = "timed" | "all_day";

function toBackendType(uiType: UIType, tasksPerDay: number): "single" | "multi" | "all_day" {
  if (uiType === "all_day") return "all_day";
  return tasksPerDay > 1 ? "multi" : "single";
}

const inputClass = "w-full px-4 py-3 rounded-md text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors";
const inputStyle = { background: "var(--color-surface2)", border: "1.5px solid var(--color-border)" };

export default function CreateChallenge() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const restartFrom = (location.state as any)?.restartFrom ?? null;
  const { dark } = useThemeStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [step, setStep] = useState<"select" | "configure">(restartFrom ? "configure" : "select");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const [title, setTitle] = useState(restartFrom?.challenge.title ?? "");
  const [displayTitle, setDisplayTitle] = useState(
    restartFrom ? translateTemplateName(restartFrom.challenge.title, i18n.language) : ""
  );
  const [description, setDescription] = useState(restartFrom?.challenge.description ?? "");
  const [uiType, setUiType] = useState<UIType>(restartFrom?.challenge.type === "all_day" ? "all_day" : "timed");
  const [duration, setDuration] = useState(restartFrom?.challenge.default_duration_days ?? 30);
  const [tasksPerDay, setTasksPerDay] = useState(restartFrom?.challenge.tasks_per_day ?? 1);
  const [taskTimes, setTaskTimes] = useState<string[]>(restartFrom?.challenge.task_times ?? ["07:00"]);
  const [startDate, setStartDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPastEndModal, setShowPastEndModal] = useState(false);

  useEffect(() => {
    challengesApi.templates().then((r) => {
      const data: Template[] = r.data;
      setTemplates(data);
      const templateId = searchParams.get("template");
      if (templateId && !restartFrom) {
        const match = data.find((t) => t.id === Number(templateId));
        if (match) applyTemplate(match);
      }
    });
  }, []);

  const applyTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);  // store English canonical — translateTemplateName works for any language
    setDisplayTitle(translateTemplateName(tpl.title, i18n.language));  // show translated in input
    setDescription(translateTemplateDesc(tpl.description || "", i18n.language));
    setUiType(tpl.type === "all_day" ? "all_day" : "timed");
    setDuration(tpl.default_duration_days);
    setTasksPerDay(tpl.tasks_per_day);
    setTaskTimes(Array.from({ length: tpl.tasks_per_day }, (_, i) =>
      String(7 + i).padStart(2, "0") + ":00"
    ));
    setStep("configure");
  };

  const doSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const backendType = toBackendType(uiType, tasksPerDay);
      const times = uiType === "all_day" ? null : taskTimes.slice(0, tasksPerDay);
      const { data: challenge } = await challengesApi.create({
        title,
        description: description || null,
        type: backendType,
        default_duration_days: duration,
        tasks_per_day: tasksPerDay,
        task_times: times,
        source_template_id: selectedTemplate?.id ?? restartFrom?.challenge.source_template_id ?? null,
      });
      await challengesApi.start(challenge.id, startDate);
      navigate("/challenges");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("create_challenge.failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration - 1);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (endDate < todayDate) {
      setShowPastEndModal(true);
      return;
    }
    doSubmit();
  };

  if (step === "select") {
    return (
      <div className="space-y-4">
        <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
          {t("create_challenge.title")}
        </h2>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <StepDot active label="1" />
          <div className="flex-1 h-0.5 rounded-full" style={{ background: "var(--color-border)" }} />
          <StepDot active={false} label="2" />
        </div>

        <button
          onClick={() => { setSelectedTemplate(null); setTitle(""); setDisplayTitle(""); setStep("configure"); }}
          className="w-full py-3.5 rounded-md text-[13px] font-bold transition-colors"
          style={{ border: "2px dashed var(--color-accent)", color: "var(--color-accent)" }}>
          {t("create_challenge.from_scratch")}
        </button>

        <div className="space-y-4">
          {groupTemplatesByCategory(templates, i18n.language).map(({ category, items }) => (
            <div key={category}>
              <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                {category}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {items.map((tpl) => (
                  <TemplateCard key={tpl.id} tpl={tpl} dark={dark} onClick={() => applyTemplate(tpl)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => restartFrom ? navigate(`/challenges/${restartFrom.id}`) : setStep("select")}
          className="flex items-center gap-1 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          <ArrowLeftIcon size={15} />
          {t("common.back")}
        </button>
      </div>

      {!restartFrom && (
        <div className="flex items-center gap-2">
          <StepDot active label="1" />
          <div className="flex-1 h-0.5 rounded-full" style={{ background: "var(--color-accent)" }} />
          <StepDot active label="2" />
        </div>
      )}

      <h2 className="text-[20px] font-black text-text-primary" style={{ letterSpacing: "-0.3px" }}>
        {restartFrom ? t("challenges.restart") : selectedTemplate ? t("create_challenge.customize") : t("create_challenge.title")}
      </h2>

      {error && (
        <div className="px-3 py-2.5 rounded-md text-[13px]"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("create_challenge.title_label")}>
          <input type="text" value={displayTitle}
            onChange={(e) => { setDisplayTitle(e.target.value); setTitle(e.target.value); setSelectedTemplate(null); }}
            required placeholder={t("create_challenge.title_placeholder")}
            className={inputClass} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
        </Field>

        <Field label={t("create_challenge.description_label")}>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} className={inputClass + " resize-none"} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
        </Field>

        <Field label={t("create_challenge.type_label")}>
          <div className="grid grid-cols-2 gap-2">
            {(["timed", "all_day"] as const).map((tp) => (
              <button key={tp} type="button" onClick={() => {
                setUiType(tp);
                if (tp === "all_day") setTasksPerDay(1);
              }}
                className="py-2.5 text-[12px] font-bold rounded-md transition-colors"
                style={{
                  border: `1.5px solid ${uiType === tp ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: uiType === tp ? "var(--color-accent-soft)" : "var(--color-surface2)",
                  color: uiType === tp ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}>
                {t(`create_challenge.type_${tp}` as any)}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("create_challenge.duration_label")}>
            <input type="number" min={1} max={365} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputClass} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </Field>
          {uiType === "timed" && (
            <Field label={t("create_challenge.tasks_per_day_label")}>
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
            </Field>
          )}
        </div>

        {uiType === "timed" && (
          <Field label={t("create_challenge.times_label")}>
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
          </Field>
        )}

        <Field label={t("create_challenge.start_date_label")}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className={inputClass} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
        </Field>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-md text-[14px] font-bold text-white disabled:opacity-50 transition-opacity"
          style={{ background: "var(--color-accent)" }}>
          {loading ? t("create_challenge.submitting") : t("create_challenge.submit")}
        </button>
      </form>

      {showPastEndModal && (
        <ConfirmModal
          emoji="📅"
          title={t("common.confirm_past_end")}
          body={t("common.confirm_past_end_body")}
          confirmLabel={t("common.confirm_past_end_yes")}
          cancelLabel={t("common.confirm_past_end_no")}
          confirmDanger={false}
          onConfirm={() => { setShowPastEndModal(false); doSubmit(); }}
          onCancel={() => setShowPastEndModal(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
      style={{
        background: active ? "var(--color-accent)" : "var(--color-surface2)",
        color: active ? "white" : "var(--color-text-tertiary)",
      }}>
      {label}
    </div>
  );
}

function groupTemplatesByCategory(templates: Template[], lang: string): { category: string; items: Template[] }[] {
  return CATEGORY_ORDER
    .map((catKey) => ({
      category: translateCategoryLabel(catKey, lang),
      items: templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === catKey),
    }))
    .filter(({ items }) => items.length > 0);
}

function TemplateCard({ tpl, dark, onClick }: { tpl: Template; dark: boolean; onClick: () => void }) {
  const { t, i18n } = useTranslation();
  const { accent, bg } = useCategoryStyle(tpl.title, dark);
  const lang = i18n.language;
  const icon = tpl.icon || "🎯";

  return (
    <button onClick={onClick}
      className="w-full text-left rounded-md p-4 transition-all hover:shadow-md"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0"
          style={{ background: bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary text-[14px]">{translateTemplateName(tpl.title, lang)}</p>
          {tpl.description && (
            <p className="text-[12px] text-text-tertiary line-clamp-1 mt-0.5">
              {translateTemplateDesc(tpl.description, lang)}
            </p>
          )}
          <p className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
            {tpl.default_duration_days} {t("challenges.days_abbr")} · {tpl.tasks_per_day}{t("challenges.per_day_abbr")}
          </p>
        </div>
      </div>
    </button>
  );
}
