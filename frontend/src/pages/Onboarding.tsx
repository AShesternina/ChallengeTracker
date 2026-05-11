import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { challengesApi, userApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import {
  translateTemplateName,
  translateTemplateDesc,
  CATEGORY_ORDER,
  TEMPLATE_CATEGORY_MAP,
  translateCategoryLabel,
  SLUG_TO_TITLE,
} from "../utils/templateTranslations";

type Step = "welcome" | "category" | "templates" | "configure";
type UIType = "timed" | "all_day";

// 3 featured categories shown on welcome screen
const FEATURED_CATEGORIES = [
  "🥗 Health & Nutrition",
  "🏃 Sport",
  "🧘 Mental Health",
];

function toBackendType(uiType: UIType, tasksPerDay: number): "single" | "multi" | "all_day" {
  if (uiType === "all_day") return "all_day";
  return tasksPerDay > 1 ? "multi" : "single";
}

interface Template {
  id: number;
  title: string;
  description: string | null;
  type: string;
  default_duration_days: number;
  tasks_per_day: number;
  icon: string | null;
}

const inputClass = "w-full px-4 py-3 rounded-md text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors";
const inputStyle = { background: "var(--color-surface2)", border: "1.5px solid var(--color-border)" };

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthStore();
  const { dark } = useThemeStore();

  const [step, setStep] = useState<Step>("welcome");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Configure step
  const today = format(new Date(), "yyyy-MM-dd");
  const [title, setTitle] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [uiType, setUiType] = useState<UIType>("timed");
  const [duration, setDuration] = useState(30);
  const [tasksPerDay, setTasksPerDay] = useState(1);
  const [taskTimes, setTaskTimes] = useState<string[]>(["07:00"]);
  const [startDate, setStartDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    challengesApi.templates().then((r) => {
      const data: Template[] = r.data;
      setTemplates(data);
      const slug = searchParams.get("challenge");
      if (slug) {
        const targetTitle = SLUG_TO_TITLE[slug];
        const match = data.find((t) => t.title === targetTitle);
        if (match) {
          const catKey = TEMPLATE_CATEGORY_MAP[match.title] || "";
          setSelectedCategory(catKey);
          handlePickTemplate(match);
        }
      }
    });
  }, []);

  const markDone = async () => {
    if (user) setUser({ ...user, onboarding_completed: true });
    try {
      const { data } = await userApi.update({ onboarding_completed: true });
      setUser(data);
    } catch {}
  };

  const handleSkip = async () => {
    await markDone();
    navigate("/");
  };

  const handlePickCategory = (catKey: string) => {
    setSelectedCategory(catKey);
    setStep("templates");
  };

  const handlePickTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);
    setDisplayTitle(translateTemplateName(tpl.title, i18n.language));
    setUiType(tpl.type === "all_day" ? "all_day" : "timed");
    setDuration(tpl.default_duration_days);
    setTasksPerDay(tpl.tasks_per_day);
    setTaskTimes(Array.from({ length: tpl.tasks_per_day }, (_, i) => `0${7 + i}:00`.slice(-5)));
    setStep("configure");
  };

  const handleCreateOwn = () => {
    setSelectedTemplate(null);
    setTitle("");
    setDisplayTitle("");
    setUiType("timed");
    setDuration(30);
    setTasksPerDay(1);
    setTaskTimes(["07:00"]);
    setStep("configure");
  };

  const handleLaunch = async () => {
    setError("");
    setLoading(true);
    try {
      const backendType = toBackendType(uiType, tasksPerDay);
      const times = uiType === "all_day" ? null : taskTimes.slice(0, tasksPerDay);
      const { data: challenge } = await challengesApi.create({
        title,
        type: backendType,
        default_duration_days: duration,
        tasks_per_day: tasksPerDay,
        task_times: times,
        source_template_id: selectedTemplate?.id ?? null,
      });
      await challengesApi.start(challenge.id, startDate);
      await markDone();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("create_challenge.failed"));
    } finally {
      setLoading(false);
    }
  };

  const lang = i18n.language;

  // ── Welcome ────────────────────────────────────────────────────────────────
  if (step === "welcome") {
    const otherCount = CATEGORY_ORDER.length - FEATURED_CATEGORIES.length;
    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-12"
        style={{ background: "var(--color-bg)" }}>
        <div className="w-full max-w-md mx-auto">

          <h1 className="text-[30px] font-black text-text-primary mb-2" style={{ letterSpacing: "-0.6px" }}>
            {t("onboarding.welcome_question")}
          </h1>
          <p className="text-[14px] text-text-tertiary mb-8">
            {t("onboarding.welcome_hint")}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {FEATURED_CATEGORIES.map((catKey) => {
              const label = translateCategoryLabel(catKey, lang);
              const [emoji, ...rest] = label.split(" ");
              const labelText = rest.join(" ");
              const count = templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === catKey).length;
              return (
                <button key={catKey}
                  onClick={() => handlePickCategory(catKey)}
                  className="flex flex-col items-center text-center rounded-2xl p-4 transition-all hover:shadow-md active:scale-95"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <span className="text-3xl mb-2">{emoji}</span>
                  <span className="text-[12px] font-bold text-text-primary leading-tight">{labelText}</span>
                  <span className="text-[10px] text-text-tertiary mt-1">{count} {t("onboarding.challenges_count")}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep("category")}
            className="w-full py-3 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-accent)" }}>
            {t("onboarding.see_all_categories", { count: otherCount })}
          </button>

          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
            <button onClick={handleCreateOwn}
              className="w-full py-3 rounded-xl text-[13px] font-semibold transition-colors"
              style={{
                border: "1.5px dashed var(--color-border-strong)",
                color: "var(--color-text-tertiary)",
              }}>
              {t("onboarding.pick_custom")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Category picker ────────────────────────────────────────────────────────
  if (step === "category") {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: "var(--color-bg)" }}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep("welcome")}
            className="text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors mb-4">
            ← {t("common.back")}
          </button>
          <h2 className="text-[22px] font-black text-text-primary mb-5" style={{ letterSpacing: "-0.4px" }}>
            {t("onboarding.pick_category_title")}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_ORDER.map((catKey) => {
              const label = translateCategoryLabel(catKey, lang);
              const [emoji, ...rest] = label.split(" ");
              const labelText = rest.join(" ");
              const count = templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === catKey).length;
              return (
                <button key={catKey}
                  onClick={() => handlePickCategory(catKey)}
                  className="text-left rounded-xl p-4 transition-all hover:shadow-md active:scale-95"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className="font-bold text-text-primary text-[13px] leading-tight">{labelText}</p>
                  <p className="text-[11px] text-text-tertiary mt-1">{count} {t("onboarding.challenges_count")}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Template picker ────────────────────────────────────────────────────────
  if (step === "templates") {
    const categoryTemplates = templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === selectedCategory);
    const categoryLabel = translateCategoryLabel(selectedCategory, lang);
    const backStep = FEATURED_CATEGORIES.includes(selectedCategory) ? "welcome" : "category";

    return (
      <div className="min-h-screen px-4 py-8" style={{ background: "var(--color-bg)" }}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep(backStep)}
            className="text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors mb-4">
            ← {t("common.back")}
          </button>
          <h2 className="text-[22px] font-black text-text-primary mb-1" style={{ letterSpacing: "-0.4px" }}>
            {categoryLabel}
          </h2>
          <p className="text-[13px] text-text-tertiary mb-5">
            {t("onboarding.pick_subtitle")}
          </p>

          <div className="space-y-2">
            {categoryTemplates.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} dark={dark} onClick={() => handlePickTemplate(tpl)} />
            ))}
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--color-border)" }}>
            <button onClick={handleCreateOwn}
              className="w-full py-3.5 rounded-md text-[14px] font-bold transition-colors"
              style={{
                background: "var(--color-surface)",
                border: "1.5px dashed var(--color-border-strong)",
                color: "var(--color-accent)",
              }}>
              {t("onboarding.pick_custom")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Configure ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-sm mx-auto">
        <button onClick={() => setStep(selectedTemplate ? "templates" : "welcome")}
          className="text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors mb-4">
          ← {t("common.back")}
        </button>
        <h2 className="text-[22px] font-black text-text-primary mb-6" style={{ letterSpacing: "-0.4px" }}>
          {t("onboarding.configure_title")}
        </h2>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-md text-[13px]"
            style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Field label={t("create_challenge.title_label")}>
            <input type="text" value={displayTitle}
              onChange={(e) => { setDisplayTitle(e.target.value); setTitle(e.target.value); }}
              required placeholder={t("create_challenge.title_placeholder")}
              className={inputClass} style={inputStyle}
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

          <button onClick={handleLaunch} disabled={loading || !title.trim()}
            className="w-full py-3.5 rounded-md text-[14px] font-bold text-white disabled:opacity-50 transition-opacity"
            style={{ background: "var(--color-accent)" }}>
            {loading ? t("onboarding.launching") : t("onboarding.launch")}
          </button>

          <button onClick={handleSkip}
            className="w-full py-2 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
            {t("onboarding.skip")}
          </button>
        </div>
      </div>
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
        <div className="shrink-0 text-text-tertiary">→</div>
      </div>
    </button>
  );
}
