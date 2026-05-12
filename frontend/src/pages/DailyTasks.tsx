import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru as ruLocale, es as esLocale, ptBR as ptLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { dailyApi, challengesApi } from "../services/api";
import { useTaskStore } from "../store/taskStore";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ChevronRightIcon } from "../components/Icons";
import TaskCard from "../components/TaskCard";
import { translateTemplateName } from "../utils/templateTranslations";

type Tab = "tasks" | "challenges";
type ChallengeFilter = "active" | "paused" | "completed";

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
};

export default function DailyTasks() {
  const { t, i18n } = useTranslation();
  const { summary, setSummary, setLoading, loading, updateTask } = useTaskStore();
  const { dark } = useThemeStore();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("tasks");

  // My Challenges tab state
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>("active");

  const dateLocale = i18n.language.startsWith("ru") ? ruLocale
    : i18n.language.startsWith("es") ? esLocale
    : i18n.language.startsWith("pt") ? ptLocale
    : enUS;

  useEffect(() => {
    setLoading(true);
    const todayDate = format(new Date(), "yyyy-MM-dd");
    dailyApi.today(todayDate)
      .then((r) => setSummary(r.data))
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, []);

  // Load my challenges when tab is opened
  useEffect(() => {
    if (tab !== "challenges") return;
    setInstancesLoading(true);
    challengesApi.my().then((r) => setInstances(r.data)).finally(() => setInstancesLoading(false));
  }, [tab]);

  const handleComplete = async (id: number) => {
    setActionLoading(id);
    try { const { data } = await dailyApi.complete(id); updateTask(data); }
    catch { setError(t("daily.action_failed")); }
    finally { setActionLoading(null); }
  };

  const handleSkip = async (id: number) => {
    setActionLoading(id);
    try { const { data } = await dailyApi.skip(id); updateTask(data); }
    catch { setError(t("daily.action_failed")); }
    finally { setActionLoading(null); }
  };

  const handleUndo = async (id: number) => {
    setActionLoading(id);
    try { const { data } = await dailyApi.reset(id); updateTask(data); }
    catch { setError(t("daily.action_failed")); }
    finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const visibleTasks = summary?.tasks.filter((t) => t.challenge_status !== "paused") ?? [];
  const pending = visibleTasks.filter((t) => t.status === "pending");
  const done = visibleTasks.filter((t) => t.status !== "pending");
  const visibleTotal = visibleTasks.length;
  const visibleCompleted = visibleTasks.filter((t) => t.status === "completed").length;

  const todayIso = format(new Date(), "yyyy-MM-dd");

  const CHALLENGE_FILTERS: { key: ChallengeFilter; label: string }[] = [
    { key: "active",    label: t("challenges.tab_active") },
    { key: "paused",    label: t("challenges.tab_paused") },
    { key: "completed", label: t("challenges.tab_completed") },
  ];
  const countFor = (key: ChallengeFilter) =>
    instances.filter((i) => i.status === key).length;
  const filteredInstances = instances.filter((i) => i.status === challengeFilter);

  const currentInstances = challengeFilter === "active"
    ? filteredInstances.filter((i) => i.start_date <= todayIso)
    : filteredInstances;
  const upcomingInstances = challengeFilter === "active"
    ? filteredInstances.filter((i) => i.start_date > todayIso)
    : [];

  return (
    <div className="space-y-4 w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <p className="text-[12px] font-medium text-text-tertiary capitalize">
          {format(new Date(), "EEEE, d MMMM", { locale: dateLocale })}
        </p>
        <div className="flex items-baseline justify-between mt-0.5">
          <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
            {tab === "tasks" ? t("daily.title") : t("challenges.my_title")}
          </h2>
          {tab === "tasks" && visibleTotal > 0 && (
            <span className="text-[13px] font-bold" style={{ color: "var(--color-accent)" }}>
              {visibleCompleted}/{visibleTotal}
            </span>
          )}
        </div>
        {/* Thin progress line — only on tasks tab */}
        {tab === "tasks" && visibleTotal > 0 && (
          <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(visibleCompleted / visibleTotal) * 100}%`, background: "var(--color-accent)" }} />
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-md text-[13px]"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* Main tabs */}
      <div className="flex rounded-md p-1 gap-1" style={{ background: "var(--color-surface2)" }}>
        <TabBtn active={tab === "tasks"} onClick={() => setTab("tasks")} label={t("daily.tasks_tab")} />
        <TabBtn active={tab === "challenges"} onClick={() => setTab("challenges")} label={t("daily.challenges_tab")} />
      </div>

      {/* ── TASKS TAB ─────────────────────────────────────────────────────── */}
      {tab === "tasks" && (
        <>
          {visibleTotal === 0 && (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-bold text-text-primary">{t("daily.no_tasks")}</p>
              <p className="text-[13px] text-text-tertiary mt-1">{t("daily.no_tasks_hint")}</p>
            </div>
          )}
          {pending.length === 0 && visibleTotal > 0 && (
            <CelebrationBanner message={t("daily.all_done")} />
          )}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
                {t("daily.pending_label", { count: pending.length })}
              </p>
              {pending.map((task) => (
                <TaskCard key={task.id} task={task}
                  onComplete={handleComplete} onSkip={handleSkip} onUndo={handleUndo}
                  loading={actionLoading === task.id} />
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
                {t("daily.done_label", { count: done.length })}
              </p>
              {done.map((task) => (
                <TaskCard key={task.id} task={task}
                  onComplete={handleComplete} onSkip={handleSkip} onUndo={handleUndo}
                  loading={actionLoading === task.id} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MY CHALLENGES TAB ─────────────────────────────────────────────── */}
      {tab === "challenges" && (
        <>
          {instancesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              {instances.length > 0 && (
                <div className="flex rounded-md p-1 gap-1" style={{ background: "var(--color-surface2)" }}>
                  {CHALLENGE_FILTERS.map(({ key, label }) => {
                    const count = countFor(key);
                    return (
                      <button key={key} onClick={() => setChallengeFilter(key)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-bold rounded-sm transition-all"
                        style={{
                          background: challengeFilter === key ? "var(--color-surface)" : "transparent",
                          color: challengeFilter === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                          boxShadow: challengeFilter === key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                        }}>
                        {label}
                        {count > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                            style={{
                              background: challengeFilter === key ? "var(--color-accent-soft)" : "var(--color-surface)",
                              color: challengeFilter === key ? "var(--color-accent)" : "var(--color-text-tertiary)",
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
              {filteredInstances.length === 0 && (
                <div className="text-center py-14">
                  <p className="text-4xl mb-3">
                    {challengeFilter === "active" ? "🎯" : challengeFilter === "paused" ? "⏸️" : "📦"}
                  </p>
                  <p className="font-bold text-text-primary">
                    {challengeFilter === "active" ? t("challenges.no_challenges")
                      : challengeFilter === "paused" ? t("challenges.no_paused")
                      : t("challenges.no_completed")}
                  </p>
                  {challengeFilter === "active" && (
                    <Link to="/challenges"
                      className="text-[13px] font-semibold mt-2 block"
                      style={{ color: "var(--color-accent)" }}>
                      {t("challenges.browse_library")}
                    </Link>
                  )}
                </div>
              )}

              {/* Challenge cards — current */}
              {currentInstances.length > 0 && (
                <div className="space-y-2.5">
                  {upcomingInstances.length > 0 && (
                    <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
                      {t("challenges.section_current")}
                    </p>
                  )}
                  {currentInstances.map((instance) => (
                    <ChallengeCard key={instance.id} instance={instance} dark={dark} dateLocale={dateLocale} />
                  ))}
                </div>
              )}

              {/* Challenge cards — upcoming */}
              {upcomingInstances.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5 mt-1">
                    {t("challenges.section_upcoming")}
                  </p>
                  {upcomingInstances.map((instance) => (
                    <ChallengeCard key={instance.id} instance={instance} dark={dark} dateLocale={dateLocale} upcoming />
                  ))}
                </div>
              )}

              {/* New challenge button */}
              <Link to="/challenges"
                className="block w-full py-3 rounded-xl text-[13px] font-bold text-center transition-colors mt-2"
                style={{ border: "1.5px dashed var(--color-border-strong)", color: "var(--color-accent)" }}>
                + {t("challenges.new_challenge")}
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}

function CelebrationBanner({ message }: { message: string }) {
  const PARTICLES = [
    { emoji: "🎉", left: "20%", anim: "floatUpLeft",   delay: "0s" },
    { emoji: "✨", left: "46%", anim: "floatUpCenter",  delay: "0.12s" },
    { emoji: "🔥", left: "72%", anim: "floatUpRight",   delay: "0.06s" },
  ];
  return (
    <div className="relative">
      {PARTICLES.map(({ emoji, left, anim, delay }) => (
        <span key={emoji} className="celebrate-particle"
          style={{ left, top: "0px", animationName: anim, animationDelay: delay }}>
          {emoji}
        </span>
      ))}
      <div className="celebrate-banner text-center py-4 rounded-md"
        style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
        <p className="text-2xl mb-1">✅</p>
        <p className="font-bold text-success text-[14px]">{message}</p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="flex-1 py-2 text-[13px] font-bold rounded-sm transition-all"
      style={{
        background: active ? "var(--color-surface)" : "transparent",
        color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
      }}>
      {label}
    </button>
  );
}

function ChallengeCard({ instance, dark, dateLocale, upcoming }: {
  instance: ChallengeInstance;
  dark: boolean;
  dateLocale: any;
  upcoming?: boolean;
}) {
  const { i18n, t } = useTranslation();
  const { icon, accent, bg } = useCategoryStyle(instance.challenge.title, dark);
  const style = STATUS_STYLE[instance.status] ?? STATUS_STYLE.completed;
  const isArchived = instance.status === "completed";

  const totalDays = Math.ceil(
    (new Date(instance.end_date).getTime() - new Date(instance.start_date).getTime()) / 86400000
  ) + 1;
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(instance.end_date).getTime() - Date.now()) / 86400000
  ));
  const daysUntilStart = upcoming
    ? Math.ceil((new Date(instance.start_date).getTime() - Date.now()) / 86400000)
    : 0;
  const progress = upcoming ? 0 : Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  return (
    <Link to={`/challenges/${instance.id}`}
      className="block rounded-md p-4 transition-all hover:shadow-md"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", opacity: upcoming ? 0.7 : isArchived ? 0.8 : 1 }}>
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
            {!upcoming && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                style={{ background: style.bg, color: style.text }}>
                {t(`challenges.status_${instance.status}` as any, { defaultValue: instance.status })}
              </span>
            )}
          </div>
          <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: isArchived ? "var(--color-border-strong)" : accent }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-tertiary">
              {format(new Date(instance.start_date), "d MMM", { locale: dateLocale })} →{" "}
              {format(new Date(instance.end_date), "d MMM yyyy", { locale: dateLocale })}
            </p>
            {upcoming ? (
              <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-tertiary)" }}>
                {t("challenges.starts_in", { n: daysUntilStart })}
              </p>
            ) : (
              <p className="text-[11px] font-semibold"
                style={{ color: isArchived ? "var(--color-text-tertiary)" : accent }}>
                {progress}%
              </p>
            )}
          </div>
        </div>
        <ChevronRightIcon size={14} className="text-text-tertiary shrink-0 mt-1" />
      </div>
    </Link>
  );
}
