import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import {
  translateTemplateName,
  translateTemplateDesc,
  translateCategoryLabel,
  CATEGORY_ORDER,
  TEMPLATE_CATEGORY_MAP,
} from "../utils/templateTranslations";

interface Template {
  id: number;
  title: string;
  description: string | null;
  type: string;
  default_duration_days: number;
  tasks_per_day: number;
  icon: string | null;
  slug: string | null;
}

export default function Challenges() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { dark } = useThemeStore();
  const lang = i18n.language;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    challengesApi.templates().then((r) => {
      setTemplates(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // ── Category list ──────────────────────────────────────────────────────────
  if (!selectedCategory) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
            {t("nav.challenges")}
          </h2>
          <p className="text-[13px] text-text-tertiary mt-1">{t("templates_page.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORY_ORDER.map((catKey) => {
            const label = translateCategoryLabel(catKey, lang);
            const [emoji, ...rest] = label.split(" ");
            const labelText = rest.join(" ");
            const count = templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === catKey).length;
            if (count === 0) return null;
            return (
              <button key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className="text-left rounded-xl p-4 transition-all hover:shadow-md active:scale-95"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="text-2xl mb-2">{emoji}</div>
                <p className="font-bold text-text-primary text-[13px] leading-tight">{labelText}</p>
                <p className="text-[11px] text-text-tertiary mt-1">
                  {count} {t("onboarding.challenges_count")}
                </p>
              </button>
            );
          })}
        </div>

        <div className="pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={() => navigate("/challenges/new")}
            className="w-full py-3.5 rounded-xl text-[14px] font-bold transition-colors"
            style={{
              border: "1.5px dashed var(--color-border-strong)",
              color: "var(--color-accent)",
            }}>
            {t("create_challenge.from_scratch")}
          </button>
        </div>
      </div>
    );
  }

  // ── Template list ──────────────────────────────────────────────────────────
  const categoryTemplates = templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === selectedCategory);
  const categoryLabel = translateCategoryLabel(selectedCategory, lang);

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => setSelectedCategory(null)}
          className="text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors mb-3">
          ← {t("templates_page.all_categories")}
        </button>
        <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
          {categoryLabel}
        </h2>
      </div>

      <div className="space-y-2">
        {categoryTemplates.map((tpl) => (
          <TemplateCard key={tpl.id} tpl={tpl} dark={dark} onStart={() => navigate(`/challenges/new?template=${tpl.id}`)} />
        ))}
      </div>

      <div className="pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button
          onClick={() => navigate("/challenges/new")}
          className="w-full py-3.5 rounded-xl text-[14px] font-bold transition-colors"
          style={{
            border: "1.5px dashed var(--color-border-strong)",
            color: "var(--color-accent)",
          }}>
          {t("create_challenge.from_scratch")}
        </button>
      </div>
    </div>
  );
}

function TemplateCard({ tpl, dark, onStart }: { tpl: Template; dark: boolean; onStart: () => void }) {
  const { t, i18n } = useTranslation();
  const { accent, bg } = useCategoryStyle(tpl.title, dark);
  const lang = i18n.language;
  const icon = tpl.icon || "🎯";

  return (
    <button onClick={onStart}
      className="w-full text-left rounded-xl p-4 transition-all hover:shadow-md active:scale-[0.99]"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0"
          style={{ background: bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary text-[14px] leading-snug">
            {translateTemplateName(tpl.title, lang)}
          </p>
          {tpl.description && (
            <p className="text-[12px] text-text-tertiary line-clamp-1 mt-0.5">
              {translateTemplateDesc(tpl.description, lang)}
            </p>
          )}
          <p className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
            {tpl.default_duration_days} {t("challenges.days_abbr")}
            {tpl.tasks_per_day > 1 && ` · ${tpl.tasks_per_day}${t("challenges.per_day_abbr")}`}
          </p>
        </div>
        <span className="text-text-tertiary text-[16px] shrink-0">›</span>
      </div>
    </button>
  );
}
