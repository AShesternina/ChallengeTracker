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
import InstallBanner from "../components/InstallBanner";
import { FlameIcon } from "../components/Icons";
import { useCategoryStyle } from "../utils/category";
import { translateTemplateName } from "../utils/templateTranslations";

interface ChallengeInstance {
  id: number;
  challenge: { title: string; type: string };
  status: string;
  start_date: string;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  useThemeStore();
  const { summary, setSummary, setLoading } = useTaskStore();
  const [streak, setStreak] = useState(0);
  const [graceDayUsed, setGraceDayUsed] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeInstance[]>([]);
  const [momentum, setMomentum] = useState<{ score: number; trend: string; days_tracked: number } | null>(null);

  const dateLocale = i18n.language.startsWith("ru") ? ruLocale
    : i18n.language.startsWith("es") ? esLocale
    : i18n.language.startsWith("pt") ? ptLocale
    : enUS;

  useEffect(() => {
    setLoading(true);
    const todayDate = format(new Date(), "yyyy-MM-dd");
    Promise.all([
      dailyApi.today(todayDate),
      challengesApi.my(),
      reportsApi.streak(),
      reportsApi.momentum(),
    ])
      .then(([daily, challenges, streakData, momentumData]) => {
        setSummary(daily.data);
        setActiveChallenges(challenges.data.filter((c: ChallengeInstance) => c.status === "active"));
        setStreak(streakData.data.current_streak);
        setGraceDayUsed(streakData.data.grace_day_used ?? false);
        setMomentum(momentumData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const todayIso = format(new Date(), "yyyy-MM-dd");

  const visibleTasks = summary?.tasks.filter((t) => t.challenge_status !== "paused") ?? [];
  const visibleTotal = visibleTasks.length;
  const visibleCompleted = visibleTasks.filter((t) => t.status === "completed").length;
  const visiblePending = visibleTasks.filter((t) => t.status === "pending").length;

  const completionRate = visibleTotal > 0
    ? Math.round((visibleCompleted / visibleTotal) * 100)
    : 0;

  const currentChallenges = activeChallenges.filter((c) => c.start_date <= todayIso);
  const upcomingChallenges = activeChallenges.filter((c) => c.start_date > todayIso);

  const userName = user?.name || user?.email?.split("@")[0] || "there";
  const todayStr = format(new Date(), "EEEE, d MMMM", { locale: dateLocale });

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
    <div className="space-y-4 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-text-tertiary capitalize">{todayStr}</p>
          <h2 className="text-[20px] font-black text-text-primary" style={{ letterSpacing: "-0.3px" }}>
            {t("dashboard.greeting", { name: userName })}
          </h2>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "var(--color-warning-bg)" }}>
            <FlameIcon size={13} className="text-warning" />
            <span className="text-[13px] font-black" style={{ color: "var(--color-warning)" }}>
              {streak}
            </span>
            {graceDayUsed && <span className="text-[11px]" title="Grace day used">⚡</span>}
          </div>
        )}
      </div>

      <InstallBanner />

      {/* Hero progress card */}
      <Link to="/daily"
        className="block rounded-xl p-4 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-accent) 0%, #2563eb 100%)" }}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ProgressRing value={completionRate} size={76} stroke={6} white />
            <span className="absolute inset-0 flex items-center justify-center text-[16px] font-black text-white">
              {completionRate}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[11px] font-medium">{t("dashboard.today_progress")}</p>
            <p className="text-[34px] font-black leading-none mt-0.5">
              {visibleCompleted}
              <span className="text-[17px] font-bold text-white/60">/{visibleTotal}</span>
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              {visiblePending} {t("dashboard.remaining")}
            </p>
          </div>
          {momentum !== null && momentum.days_tracked > 0 && (
            <MomentumBadge momentum={momentum} />
          )}
        </div>
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -right-2 bottom-2 w-14 h-14 rounded-full opacity-10" style={{ background: "white" }} />
      </Link>

      {/* Active challenges — current */}
      {currentChallenges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
              {t("dashboard.active_challenges")}
            </h3>
            <span className="text-[11px] font-bold text-text-tertiary">
              {currentChallenges.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {currentChallenges.map((ci) => (
              <ChallengeCard key={ci.id} instance={ci} tasks={tasksByChallenge[ci.id]} lang={i18n.language} />
            ))}
          </div>
        </div>
      )}

      {/* Active challenges — upcoming */}
      {upcomingChallenges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
              {t("challenges.section_upcoming")}
            </h3>
            <span className="text-[11px] font-bold text-text-tertiary">
              {upcomingChallenges.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {upcomingChallenges.map((ci) => (
              <ChallengeCard key={ci.id} instance={ci} tasks={undefined} lang={i18n.language} upcoming />
            ))}
          </div>
        </div>
      )}

      {/* Today's tasks preview */}
      {visibleTotal > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
              {t("dashboard.tasks_today")}
            </h3>
            {visibleTotal > 3 && (
              <Link to="/daily"
                className="text-[11px] font-bold"
                style={{ color: "var(--color-accent)" }}>
                {t("dashboard.view_all", { count: visibleTotal })} →
              </Link>
            )}
          </div>
          <div className="space-y-1.5">
            {visibleTasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} readOnly />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ instance, tasks, lang, upcoming }: {
  instance: ChallengeInstance;
  tasks?: { total: number; completed: number };
  lang: string;
  upcoming?: boolean;
}) {
  const { t } = useTranslation();
  const { dark } = useThemeStore();
  const { accent, bg, icon } = useCategoryStyle(instance.challenge.title, dark);
  const title = translateTemplateName(instance.challenge.title, lang);
  const total = tasks?.total ?? 0;
  const completed = tasks?.completed ?? 0;
  const rate = total > 0 ? completed / total : 0;
  const allDone = total > 0 && completed === total;
  const daysUntilStart = upcoming
    ? Math.ceil((new Date(instance.start_date).getTime() - Date.now()) / 86400000)
    : 0;

  return (
    <Link to={`/challenges/${instance.id}`}
      className="block rounded-md px-3 py-2"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", opacity: upcoming ? 0.65 : 1 }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm shrink-0"
          style={{ background: bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="font-bold text-text-primary text-[13px] truncate">{title}</p>
            <span className="text-[12px] font-semibold shrink-0"
              style={{ color: upcoming ? "var(--color-text-tertiary)" : allDone ? "var(--color-success)" : "var(--color-text-tertiary)" }}>
              {upcoming
                ? t("challenges.starts_in", { n: daysUntilStart })
                : total > 0 ? `${completed}/${total}` : t("dashboard.no_tasks_today")}
            </span>
          </div>
          {!upcoming && total > 0 && (
            <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: "var(--color-surface2)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${rate * 100}%`, background: allDone ? "var(--color-success)" : accent }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function MomentumBadge({ momentum }: {
  momentum: { score: number; trend: string; days_tracked: number }
}) {
  const { t } = useTranslation();
  const trendKey = `momentum.trend_${momentum.trend}` as any;
  const trendColor = momentum.trend === "up"
    ? "rgba(255,255,255,0.9)"
    : momentum.trend === "down"
    ? "rgba(255,255,255,0.6)"
    : "rgba(255,255,255,0.7)";

  return (
    <div className="shrink-0 text-right border-l border-white/20 pl-4">
      <p className="text-[22px] font-black text-white leading-none">{momentum.score}%</p>
      <p className="text-[10px] font-bold mt-0.5" style={{ color: trendColor }}>{t(trendKey)}</p>
      <p className="text-[9px] text-white/50">{t("momentum.label").split(" ")[0]}</p>
    </div>
  );
}
