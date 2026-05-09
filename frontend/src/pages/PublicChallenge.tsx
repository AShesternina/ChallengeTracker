import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";
import { translateTemplateName, translateTemplateDesc } from "../utils/templateTranslations";

interface PublicTemplate {
  slug: string;
  title: string;
  description: string | null;
  type: string;
  default_duration_days: number;
  tasks_per_day: number;
  task_times: string[] | null;
  icon: string | null;
}

export default function PublicChallenge() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const [template, setTemplate] = useState<PublicTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    challengesApi.getPublicTemplate(slug)
      .then((r) => setTemplate(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!template) return;
    const localTitle = translateTemplateName(template.title, i18n.language);
    document.title = `${localTitle} — ChallengeTracker`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", template.description ?? "");
  }, [template, i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (notFound || !template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ background: "var(--color-bg)" }}>
        <p className="text-[15px] font-semibold text-text-primary mb-2">Challenge not found</p>
        <Link to="/register" className="text-[13px] font-semibold" style={{ color: "var(--color-accent)" }}>
          Browse all challenges →
        </Link>
      </div>
    );
  }

  const localTitle = translateTemplateName(template.title, i18n.language);
  const localDesc = translateTemplateDesc(template.description ?? "", i18n.language);
  const typeLabel = template.type === "all_day"
    ? { en: "All day", ru: "Весь день", es: "Todo el día", pt: "Dia todo" }
    : template.tasks_per_day === 1
      ? { en: "1 task/day", ru: "1 задача/день", es: "1 tarea/día", pt: "1 tarefa/dia" }
      : { en: `${template.tasks_per_day} tasks/day`, ru: `${template.tasks_per_day} задачи/день`, es: `${template.tasks_per_day} tareas/día`, pt: `${template.tasks_per_day} tarefas/dia` };
  const lang = i18n.language.startsWith("ru") ? "ru" : i18n.language.startsWith("es") ? "es" : i18n.language.startsWith("pt") ? "pt" : "en";
  const durationLabel = { en: "days", ru: "дней", es: "días", pt: "dias" };
  const startLabel = { en: "Start Challenge", ru: "Начать челлендж", es: "Empezar reto", pt: "Iniciar desafio" };
  const loginLabel = { en: "Already have an account?", ru: "Уже есть аккаунт?", es: "¿Ya tienes cuenta?", pt: "Já tem conta?" };
  const signInLabel = { en: "Sign in", ru: "Войти", es: "Iniciar sesión", pt: "Entrar" };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm space-y-6">

        {/* App branding */}
        <div className="flex items-center justify-center gap-2">
          <img src="/icons/icon.svg" alt="ChallengeTracker" className="w-7 h-7 rounded-lg" />
          <span className="text-[14px] font-black text-text-primary" style={{ letterSpacing: "-0.3px" }}>
            ChallengeTracker
          </span>
        </div>

        {/* Challenge card */}
        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

          {/* Icon + title */}
          <div className="text-center space-y-2">
            <div className="text-5xl">{template.icon}</div>
            <h1 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
              {localTitle}
            </h1>
            <p className="text-[14px] text-text-secondary leading-snug">{localDesc}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 text-center"
              style={{ background: "var(--color-surface2)" }}>
              <p className="text-[22px] font-black text-text-primary">{template.default_duration_days}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">{durationLabel[lang]}</p>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ background: "var(--color-surface2)" }}>
              <p className="text-[22px] font-black text-text-primary">{template.tasks_per_day}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">{typeLabel[lang]}</p>
            </div>
          </div>

          {/* CTA */}
          <Link to={`/register?challenge=${slug}`}
            className="block w-full py-3 rounded-xl text-[15px] font-bold text-white text-center transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--color-accent), #2563eb)" }}>
            {startLabel[lang]}
          </Link>
        </div>

        {/* Login link */}
        <p className="text-center text-[13px] text-text-tertiary">
          {loginLabel[lang]}{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>
            {signInLabel[lang]}
          </Link>
        </p>
      </div>
    </div>
  );
}
