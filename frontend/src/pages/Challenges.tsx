import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { challengesApi } from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { PlusIcon, ChevronRightIcon } from "../components/Icons";
import { translateTemplateName } from "../utils/templateTranslations";


interface ChallengeInstance {
  id: number;
  challenge: { id: number; title: string; description: string | null; type: string };
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

type Filter = "active" | "paused" | "completed";

export default function Challenges() {
  const { t, i18n } = useTranslation();
  const { dark } = useThemeStore();
  const dateLocale = i18n.language === "ru" ? ruLocale : enUS;
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("active");

  useEffect(() => {
    challengesApi.my().then((r) => setInstances(r.data)).finally(() => setLoading(false));
  }, []);

  const statusLabel = (status: string) =>
    t(`challenges.status_${status}` as any, { defaultValue: status });

  const filtered = instances.filter((i) => {
    if (filter === "active") return i.status === "active";
    if (filter === "paused") return i.status === "paused";
    if (filter === "completed") return i.status === "completed" || i.status === "cancelled";
    return true;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "active",    label: t("challenges.tab_active") },
    { key: "paused",    label: t("challenges.tab_paused") },
    { key: "completed", label: t("challenges.tab_completed") },
  ];

  const countFor = (key: Filter) => instances.filter((i) => {
    if (key === "active") return i.status === "active";
    if (key === "paused") return i.status === "paused";
    if (key === "completed") return i.status === "completed" || i.status === "cancelled";
    return false;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
          {t("challenges.title")}
        </h2>
        <Link to="/challenges/new"
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-bold text-white"
          style={{ background: "var(--color-accent)" }}>
          <PlusIcon size={14} strokeWidth={2.5} />
          {t("common.new")}
        </Link>
      </div>

      {/* Filter tabs */}
      {instances.length > 0 && (
        <div className="flex rounded-md p-1 gap-1"
          style={{ background: "var(--color-surface2)" }}>
          {FILTERS.map(({ key, label }) => {
            const count = countFor(key);
            return (
              <button key={key} onClick={() => setFilter(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-bold rounded-sm transition-all"
                style={{
                  background: filter === key ? "var(--color-surface)" : "transparent",
                  color: filter === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  boxShadow: filter === key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}>
                {label}
                {count > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: filter === key ? "var(--color-accent-soft)" : "var(--color-surface)",
                      color: filter === key ? "var(--color-accent)" : "var(--color-text-tertiary)",
                    }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">
            {filter === "active" ? "🎯" : filter === "paused" ? "⏸️" : "📦"}
          </p>
          <p className="font-bold text-text-primary">
            {filter === "active" ? t("challenges.no_challenges")
              : filter === "paused" ? t("challenges.no_paused")
              : t("challenges.no_completed")}
          </p>
          {filter === "active" && (
            <Link to="/challenges/new"
              className="text-[13px] font-semibold mt-2 block"
              style={{ color: "var(--color-accent)" }}>
              {t("challenges.no_challenges_hint")}
            </Link>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {filtered.map((instance) => (
          <ChallengeCard key={instance.id} instance={instance} dark={dark}
            dateLocale={dateLocale} statusLabel={statusLabel} />
        ))}
      </div>
    </div>
  );
}

function ChallengeCard({ instance, dark, dateLocale, statusLabel }: {
  instance: ChallengeInstance;
  dark: boolean;
  dateLocale: any;
  statusLabel: (s: string) => string;
}) {
  const { i18n } = useTranslation();
  const { icon, accent, bg } = useCategoryStyle(instance.challenge.title, dark);
  const style = STATUS_STYLE[instance.status] ?? STATUS_STYLE.cancelled;
  const isArchived = instance.status === "completed" || instance.status === "cancelled";

  const totalDays = Math.ceil(
    (new Date(instance.end_date).getTime() - new Date(instance.start_date).getTime()) / 86400000
  ) + 1;
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(instance.end_date).getTime() - Date.now()) / 86400000
  ));
  const progress = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  return (
    <Link to={`/challenges/${instance.id}`}
      className="block rounded-md p-4 transition-all hover:shadow-md"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", opacity: isArchived ? 0.8 : 1 }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-lg"
          style={{ background: bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-text-primary truncate text-[14px]">
              {translateTemplateName(instance.challenge.title, i18n.language)}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
              style={{ background: style.bg, color: style.text }}>
              {statusLabel(instance.status)}
            </span>
          </div>
          {instance.challenge.description && (
            <p className="text-[12px] text-text-tertiary line-clamp-1 mb-1.5">
              {instance.challenge.description}
            </p>
          )}
          <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: isArchived ? "var(--color-border-strong)" : accent }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-tertiary">
              {format(new Date(instance.start_date), "d MMM", { locale: dateLocale })} →{" "}
              {format(new Date(instance.end_date), "d MMM yyyy", { locale: dateLocale })}
            </p>
            <p className="text-[11px] font-semibold"
              style={{ color: isArchived ? "var(--color-text-tertiary)" : accent }}>
              {progress}%
            </p>
          </div>
        </div>
        <ChevronRightIcon size={14} className="text-text-tertiary shrink-0 mt-1" />
      </div>
    </Link>
  );
}
