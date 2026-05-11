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

export default function ChallengeTemplatesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { dark } = useThemeStore();
  const lang = i18n.language;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengesApi.templates().then((r) => {
      setTemplates(r.data);
      setLoading(false);
    });
  }, []);

  const handleStartTemplate = (tpl: Template) => {
    navigate(`/challenges/new?template=${tpl.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-text-tertiary">{t("common.loading")}</p>
      </div>
    );
  }

  // Category list view
  if (!selectedCategory) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[24px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
            {t("templates_page.title")}
          </h1>
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
                  {count} {t("challenges.days_abbr").includes("д") ? "челленджей" : "challenges"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Templates in selected category
  const categoryTemplates = templates.filter((t) => TEMPLATE_CATEGORY_MAP[t.title] === selectedCategory);
  const categoryLabel = translateCategoryLabel(selectedCategory, lang);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <button
        onClick={() => setSelectedCategory(null)}
        className="text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors mb-4">
        ← {t("templates_page.all_categories")}
      </button>

      <div className="mb-6">
        <h1 className="text-[24px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
          {categoryLabel}
        </h1>
      </div>

      <div className="space-y-3">
        {categoryTemplates.map((tpl) => (
          <TemplateDetailCard key={tpl.id} tpl={tpl} dark={dark} onStart={() => handleStartTemplate(tpl)} />
        ))}
      </div>
    </div>
  );
}

function TemplateDetailCard({
  tpl,
  dark,
  onStart,
}: {
  tpl: Template;
  dark: boolean;
  onStart: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { accent, bg } = useCategoryStyle(tpl.title, dark);
  const lang = i18n.language;
  const icon = tpl.icon || "🎯";

  return (
    <div className="rounded-xl p-4"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-xl shrink-0"
          style={{ background: bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary text-[15px]">
            {translateTemplateName(tpl.title, lang)}
          </p>
          {tpl.description && (
            <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
              {translateTemplateDesc(tpl.description, lang)}
            </p>
          )}
          <p className="text-[11px] font-semibold mt-2" style={{ color: accent }}>
            {tpl.default_duration_days} {t("challenges.days_abbr")}
            {tpl.tasks_per_day > 1 && ` · ${tpl.tasks_per_day}${t("challenges.per_day_abbr")}`}
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className="mt-3 w-full py-2.5 rounded-md text-[13px] font-bold text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--color-accent)" }}>
        {t("templates_page.start_challenge")}
      </button>
    </div>
  );
}
