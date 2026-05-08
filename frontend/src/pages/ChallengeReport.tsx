import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { reportsApi } from "../services/api";
import { ArrowLeftIcon, FlameIcon, TrophyIcon } from "../components/Icons";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { translateTemplateName } from "../utils/templateTranslations";

interface Report {
  challenge_instance_id: number;
  challenge_title: string;
  start_date: string;
  end_date: string;
  total_tasks: number;
  completed_tasks: number;
  skipped_tasks: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  breaks_count: number;
  comebacks_count: number;
  avg_comeback_days: number | null;
  resilience_score: number | null;
}

export default function ChallengeReport() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { dark } = useThemeStore();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    reportsApi.challenge(Number(id))
      .then((r) => setReport(r.data))
      .catch(() => setError(t("challenge_report.failed")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
    </div>
  );
  if (error) return <div className="text-center py-16" style={{ color: "var(--color-danger)" }}>{error}</div>;
  if (!report) return null;

  const { icon, bg } = useCategoryStyle(report.challenge_title, dark);
  const rate = Math.round(report.completion_rate * 100);
  const rateColor = rate >= 80 ? "var(--color-success)" : rate >= 50 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/challenges"
          className="flex items-center gap-1 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          <ArrowLeftIcon size={15} />
          {t("common.back")}
        </Link>
      </div>

      {/* Hero */}
      <div className="rounded-xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: bg }}>
            {icon}
          </div>
          <h2 className="font-black text-[18px] text-text-primary leading-tight" style={{ letterSpacing: "-0.3px" }}>
            {translateTemplateName(report.challenge_title, i18n.language)}
          </h2>
        </div>

        {/* Completion bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[12px] font-semibold mb-1.5">
            <span className="text-text-secondary">{t("challenge_report.completion")}</span>
            <span style={{ color: rateColor }}>{rate}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${rate}%`, background: rateColor }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <InfoCell label={t("challenge_report.total_tasks")} value={String(report.total_tasks)} />
          <InfoCell label={t("challenge_report.completed")} value={String(report.completed_tasks)} color="var(--color-success)" />
          <InfoCell label={t("challenge_report.skipped")} value={String(report.skipped_tasks)} color="var(--color-text-tertiary)" />
          <InfoCell label={t("challenge_report.rate")} value={`${rate}%`} color={rateColor} />
        </div>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <StreakCard
          label={t("challenge_report.current_streak")}
          value={report.current_streak}
          Icon={<FlameIcon size={18} className="text-warning" />}
          bg="var(--color-warning-bg)"
        />
        <StreakCard
          label={t("challenge_report.best_streak")}
          value={report.longest_streak}
          Icon={<TrophyIcon size={18} className="text-accent" />}
          bg={bg}
        />
      </div>

      {/* Recovery analytics */}
      {report.resilience_score !== null && (
        <div className="rounded-md p-4 space-y-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
            {t("challenge_report.recovery_title")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <InfoCell
              label={t("challenge_report.resilience_score")}
              value={`${report.resilience_score}%`}
              color={report.resilience_score >= 75 ? "var(--color-success)" : report.resilience_score >= 40 ? "var(--color-warning)" : "var(--color-danger)"}
            />
            <InfoCell
              label={t("challenge_report.avg_comeback")}
              value={report.avg_comeback_days !== null ? `${report.avg_comeback_days} ${t("common.days")}` : "—"}
            />
            <InfoCell
              label={t("challenge_report.breaks")}
              value={String(report.breaks_count)}
            />
            <InfoCell
              label={t("challenge_report.comebacks")}
              value={String(report.comebacks_count)}
              color={report.comebacks_count > 0 ? "var(--color-success)" : undefined}
            />
          </div>
        </div>
      )}

      {/* Period */}
      <div className="rounded-md px-4 py-3"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
          {t("challenge_report.period")}
        </p>
        <p className="font-bold text-text-primary text-[14px]">
          {report.start_date} → {report.end_date}
        </p>
      </div>
    </div>
  );
}

function InfoCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md px-3 py-2.5 text-center" style={{ background: "var(--color-surface2)" }}>
      <p className="text-[20px] font-black" style={{ color: color || "var(--color-text-primary)" }}>{value}</p>
      <p className="text-[10px] text-text-tertiary font-medium mt-0.5">{label}</p>
    </div>
  );
}

function StreakCard({ label, value, Icon, bg }: {
  label: string; value: number; Icon: React.ReactNode; bg: string;
}) {
  return (
    <div className="rounded-md p-4"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: bg }}>
          {Icon}
        </div>
      </div>
      <p className="text-[28px] font-black text-text-primary leading-none">{value}</p>
      <p className="text-[11px] text-text-tertiary font-medium mt-0.5">{label}</p>
    </div>
  );
}
