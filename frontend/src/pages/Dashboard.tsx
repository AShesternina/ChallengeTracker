import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, es as esLocale, ptBR as ptLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { dailyApi, challengesApi, reportsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTaskStore } from "../store/taskStore";
import { useThemeStore } from "../store/themeStore";
import ProgressRing from "../components/ProgressRing";
import TaskCard from "../components/TaskCard";
import { FlameIcon, TargetIcon, CheckIcon } from "../components/Icons";
import { useCategoryStyle } from "../utils/category";
import { translateTemplateName } from "../utils/templateTranslations";

interface ChallengeInstance {
  id: number;
  challenge: { title: string; type: string };
  status: string;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  useThemeStore();
  const { summary, setSummary, setLoading } = useTaskStore();
  const [challengeCount, setChallengeCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeInstance[]>([]);
  const [momentum, setMomentum] = useState<{ score: number; trend: string; trend_delta: number; days_tracked: number } | null>(null);

  const dateLocale = i18n.language.startsWith("ru") ? ruLocale
    : i18n.language.startsWith("es") ? esLocale
    : i18n.language.startsWith("pt") ? ptLocale
    : enUS;

  useEffect(() => {
    setLoading(true);
    const now = new Date();
    const todayDate = format(now, "yyyy-MM-dd");
    Promise.all([
      dailyApi.today(todayDate),
      challengesApi.my(),
      reportsApi.streak(),
      reportsApi.momentum(),
    ])
      .then(([daily, challenges, streakData, momentumData]) => {
        setSummary(daily.data);
        const active = challenges.data.filter((c: ChallengeInstance) => c.status === "active");
        setChallengeCount(active.length);
        setActiveChallenges(active);
        setStreak(streakData.data.current_streak);
        setMomentum(momentumData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const completionRate =
    summary && summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

  const userName = user?.email?.split("@")[0] || "there";
  const todayStr = format(new Date(), "EEEE, d MMMM", { locale: dateLocale });

  // Group today's tasks by challenge_instance_id
  const tasksByChallenge: Record<number, { total: number; completed: number }> = {};
  if (summary?.tasks) {
    for (const task of summary.tasks) {
      if (task.challenge_status === "paused") continue;
      const cid = task.challenge_instance_id;
      if (!tasksByChallenge[cid]) tasksByChallenge[cid] = { total: 0, completed: 0 };
      tasksByChallenge[cid].total++;
      if (task.status === "completed") tasksByChallenge[cid].completed++;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-text-tertiary capitalize">{todayStr}</p>
          <h2 className="text-[22px] font-black text-text-primary mt-0.5" style={{ letterSpacing: "-0.4px" }}>
            {t("dashboard.greeting", { name: userName })}
          </h2>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
            style={{ background: "var(--color-warning-bg)" }}>
            <FlameIcon size={14} className="text-warning" />
            <span className="text-[13px] font-black" style={{ color: "var(--color-warning)" }}>
              {streak}
            </span>
          </div>
        )}
      </div>

      {/* Hero progress card */}
      <div className="rounded-xl p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-accent) 0%, #2563eb 100%)" }}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <ProgressRing value={completionRate} size={88} stroke={7} white />
            <span className="absolute inset-0 flex items-center justify-center text-[18px] font-black text-white">
              {completionRate}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[12px] font-medium">{t("dashboard.today_progress")}</p>
            <p className="text-[32px] font-black leading-none mt-0.5">
              {summary?.completed ?? 0}<span className="text-[18px] font-bold text-white/60">/{summary?.total ?? 0}</span>
            </p>
            <p className="text-[12px] text-white/70 mt-1">
              {summary?.pending ?? 0} {t("dashboard.remaining")}
            </p>
          </div>
        </div>
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full opacity-10" style={{ background: "white" }} />
      </div>

      {/* Momentum */}
      {momentum !== null && momentum.days_tracked > 0 && (
        <MomentumCard momentum={momentum} />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          label={t("dashboard.active")}
          value={challengeCount}
          Icon={<TargetIcon size={16} strokeWidth={2} className="text-accent" />}
          color="var(--color-accent-soft)"
        />
        <StatCard
          label={t("dashboard.completed")}
          value={summary?.completed ?? 0}
          Icon={<CheckIcon size={16} strokeWidth={2.5} className="text-success" />}
          color="var(--color-success-bg)"
        />
        <StatCard
          label={t("dashboard.skipped")}
          value={summary?.skipped ?? 0}
          Icon={<FlameIcon size={16} strokeWidth={2} className="text-warning" />}
          color="var(--color-warning-bg)"
        />
      </div>

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
            {t("dashboard.active_challenges")}
          </h3>
          <div className="space-y-2">
            {activeChallenges.map((ci) => {
              const tasks = tasksByChallenge[ci.id];
              return (
                <ChallengeCard
                  key={ci.id}
                  instance={ci}
                  tasks={tasks}
                  lang={i18n.language}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/daily"
          className="flex items-center justify-center py-3 rounded-md text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-accent)" }}>
          {t("dashboard.today_tasks")}
        </Link>
        <Link to="/challenges/new"
          className="flex items-center justify-center py-3 rounded-md text-[13px] font-bold transition-colors"
          style={{
            background: "var(--color-surface)",
            border: "1.5px solid var(--color-border-strong)",
            color: "var(--color-text-secondary)",
          }}>
          {t("dashboard.new_challenge")}
        </Link>
      </div>

      {/* Today's tasks preview */}
      {summary && summary.tasks.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-text-secondary mb-2 uppercase tracking-wide">
            {t("dashboard.tasks_today")}
          </h3>
          <div className="space-y-2">
            {summary.tasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} readOnly />
            ))}
            {summary.tasks.length > 3 && (
              <Link to="/daily"
                className="block text-center text-[12px] font-semibold py-1.5"
                style={{ color: "var(--color-accent)" }}>
                {t("dashboard.view_all", { count: summary.tasks.length })}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ instance, tasks, lang }: {
  instance: ChallengeInstance;
  tasks?: { total: number; completed: number };
  lang: string;
}) {
  const { t } = useTranslation();
  const { dark } = useThemeStore();
  const { accent, bg, icon } = useCategoryStyle(instance.challenge.title, dark);
  const title = translateTemplateName(instance.challenge.title, lang);
  const total = tasks?.total ?? 0;
  const completed = tasks?.completed ?? 0;
  const rate = total > 0 ? completed / total : 0;
  const allDone = total > 0 && completed === total;

  return (
    <div className="rounded-md px-4 py-3 flex items-center gap-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ background: bg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-text-primary text-[13px] truncate">{title}</p>
          <span className="text-[12px] font-semibold ml-2 shrink-0"
            style={{ color: allDone ? "var(--color-success)" : "var(--color-text-tertiary)" }}>
            {total > 0 ? `${completed}/${total}` : t("dashboard.no_tasks_today")}
          </span>
        </div>
        {total > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${rate * 100}%`, background: allDone ? "var(--color-success)" : accent }} />
          </div>
        )}
      </div>
      <Link to={`/challenges/${instance.id}/report`}
        className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-colors"
        style={{
          background: "var(--color-surface2)",
          color: "var(--color-text-tertiary)",
          border: "1px solid var(--color-border)",
        }}>
        {t("challenges.report")}
      </Link>
    </div>
  );
}

function MomentumCard({ momentum }: {
  momentum: { score: number; trend: string; trend_delta: number; days_tracked: number }
}) {
  const { t } = useTranslation();
  const trendKey = `momentum.trend_${momentum.trend}` as any;
  const trendColor = momentum.trend === "up"
    ? "var(--color-success)"
    : momentum.trend === "down"
    ? "var(--color-danger)"
    : "var(--color-text-tertiary)";

  return (
    <div className="rounded-md px-4 py-3 flex items-center justify-between"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div>
        <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
          {t("momentum.label")}
        </p>
        <p className="text-[11px] text-text-tertiary mt-0.5">
          {t("momentum.days", { count: momentum.days_tracked })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold" style={{ color: trendColor }}>
          {t(trendKey)}{momentum.trend !== "stable" && momentum.trend_delta !== 0 ? ` ${Math.abs(momentum.trend_delta)}%` : ""}
        </span>
        <div className="text-right">
          <p className="text-[28px] font-black text-text-primary leading-none">{momentum.score}%</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon, color }: {
  label: string; value: number; Icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-md p-3 text-center"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-center w-7 h-7 rounded-md mx-auto mb-1.5"
        style={{ background: color }}>
        {Icon}
      </div>
      <p className="text-[18px] font-black text-text-primary leading-none">{value}</p>
      <p className="text-[10px] text-text-tertiary mt-0.5 font-medium">{label}</p>
    </div>
  );
}
