import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ArrowLeftIcon } from "../components/Icons";
import { translateTemplateName, translateTemplateDesc, getTemplateCategory } from "../utils/templateTranslations";

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

const inputClass = "w-full px-4 py-3 rounded-md text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors";
const inputStyle = { background: "var(--color-surface2)", border: "1.5px solid var(--color-border)" };

export default function CreateChallenge() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { dark } = useThemeStore();
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
          onClick={() => { setSelectedTemplate(null); setTitle(""); setStep("configure"); }}
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
        <button onClick={() => setStep("select")}
          className="flex items-center gap-1 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          <ArrowLeftIcon size={15} />
          {t("common.back")}
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <StepDot active label="1" />
        <div className="flex-1 h-0.5 rounded-full" style={{ background: "var(--color-accent)" }} />
        <StepDot active label="2" />
      </div>

      <h2 className="text-[20px] font-black text-text-primary" style={{ letterSpacing: "-0.3px" }}>
        {selectedTemplate ? t("create_challenge.customize") : t("create_challenge.title")}
      </h2>

      {error && (
        <div className="px-3 py-2.5 rounded-md text-[13px]"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("create_challenge.title_label")}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
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
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("create_challenge.duration_label")}>
            <input type="number" min={1} max={365} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputClass} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
          </Field>
          {type !== "all_day" && (
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

        {type !== "all_day" && (
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
  const groups: Record<string, Template[]> = {};
  for (const tpl of templates) {
    const cat = getTemplateCategory(tpl.title, lang) || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(tpl);
  }
  return Object.entries(groups).map(([category, items]) => ({ category, items }));
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
