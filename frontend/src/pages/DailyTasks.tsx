import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ru as ruLocale, es as esLocale, ptBR as ptLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { dailyApi } from "../services/api";
import { useTaskStore, DailyTask } from "../store/taskStore";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { ArrowLeftIcon, CheckIcon } from "../components/Icons";
import TaskCard from "../components/TaskCard";
import { translateTemplateName } from "../utils/templateTranslations";

type Tab = "tasks" | "challenges";

interface ChallengeGroup {
  instanceId: number;
  title: string;
  tasks: DailyTask[];
}

export default function DailyTasks() {
  const { t, i18n } = useTranslation();
  const { summary, setSummary, setLoading, loading, updateTask } = useTaskStore();
  const { dark } = useThemeStore();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("tasks");
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeGroup | null>(null);

  const dateLocale = i18n.language.startsWith("ru") ? ruLocale
    : i18n.language.startsWith("es") ? esLocale
    : i18n.language.startsWith("pt") ? ptLocale
    : enUS;

  useEffect(() => {
    setLoading(true);
    const todayDate = format(new Date(), "yyyy-MM-dd");
    dailyApi
      .today(todayDate)
      .then((r) => setSummary(r.data))
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await dailyApi.complete(id);
      updateTask(data);
    } catch {
      setError(t("daily.action_failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await dailyApi.skip(id);
      updateTask(data);
    } catch {
      setError(t("daily.action_failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUndo = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await dailyApi.reset(id);
      updateTask(data);
    } catch {
      setError(t("daily.action_failed"));
    } finally {
      setActionLoading(null);
    }
  };

  // Group tasks by challenge
  const challengeGroups: ChallengeGroup[] = [];
  if (summary) {
    const map = new Map<number, ChallengeGroup>();
    for (const task of summary.tasks) {
      if (!map.has(task.challenge_instance_id)) {
        map.set(task.challenge_instance_id, {
          instanceId: task.challenge_instance_id,
          title: translateTemplateName(task.challenge_title, i18n.language),
          tasks: [],
        });
      }
      map.get(task.challenge_instance_id)!.tasks.push(task);
    }
    challengeGroups.push(...map.values());
  }

  // Keep selectedChallenge in sync with updated tasks
  const syncedChallenge = selectedChallenge
    ? challengeGroups.find((g) => g.instanceId === selectedChallenge.instanceId) ?? null
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const pending = summary?.tasks.filter((t) => t.status === "pending") ?? [];
  const done = summary?.tasks.filter((t) => t.status !== "pending") ?? [];
  // Exclude paused tasks — they can't be completed so shouldn't block the celebration
  const pendingActive = pending.filter((t) => t.challenge_status !== "paused");

  // Challenge detail view
  if (syncedChallenge) {
    const pendingC = syncedChallenge.tasks.filter((t) => t.status === "pending");
    const doneC = syncedChallenge.tasks.filter((t) => t.status !== "pending");
    const completedC = syncedChallenge.tasks.filter((t) => t.status === "completed").length;
    const totalC = syncedChallenge.tasks.length;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedChallenge(null)}
            className="flex items-center gap-1 text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
            <ArrowLeftIcon size={15} />
            {t("daily.back_to_challenges")}
          </button>
        </div>

        <ChallengeHero group={syncedChallenge} dark={dark} completed={completedC} total={totalC} />

        {error && (
          <div className="px-3 py-2.5 rounded-md text-[13px]"
            style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        {pendingC.length === 0 && totalC > 0 && (
          <CelebrationBanner message={t("daily.all_done")} />
        )}

        {pendingC.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
              {t("daily.pending_label", { count: pendingC.length })}
            </p>
            {pendingC.map((task) => (
              <TaskCard key={task.id} task={task}
                onComplete={handleComplete} onSkip={handleSkip} onUndo={handleUndo}
                loading={actionLoading === task.id} />
            ))}
          </div>
        )}

        {doneC.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-0.5">
              {t("daily.done_label", { count: doneC.length })}
            </p>
            {doneC.map((task) => (
              <TaskCard key={task.id} task={task}
                onComplete={handleComplete} onSkip={handleSkip} onUndo={handleUndo}
                loading={actionLoading === task.id} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[12px] font-medium text-text-tertiary capitalize">
          {format(new Date(), "EEEE, d MMMM", { locale: dateLocale })}
        </p>
        <h2 className="text-[22px] font-black text-text-primary mt-0.5" style={{ letterSpacing: "-0.4px" }}>
          {t("daily.title")}
        </h2>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-md text-[13px]"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.total > 0 && (
        <div className="rounded-md px-4 py-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex justify-between text-[12px] font-semibold mb-2">
            <span className="text-text-secondary">{t("daily.progress")}</span>
            <span className="text-text-primary">{summary.completed}/{summary.total}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(summary.completed / summary.total) * 100}%`, background: "var(--color-accent)" }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      {(summary?.total ?? 0) > 0 && (
        <div className="flex rounded-md p-1 gap-1"
          style={{ background: "var(--color-surface2)" }}>
          <TabBtn active={tab === "tasks"} onClick={() => setTab("tasks")}
            label={t("daily.tasks_tab")} />
          <TabBtn active={tab === "challenges"} onClick={() => setTab("challenges")}
            label={t("daily.challenges_tab")} />
        </div>
      )}

      {/* Empty state */}
      {summary?.total === 0 && (
        <div className="text-center py-14">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-bold text-text-primary">{t("daily.no_tasks")}</p>
          <p className="text-[13px] text-text-tertiary mt-1">{t("daily.no_tasks_hint")}</p>
        </div>
      )}

      {/* TASKS TAB */}
      {tab === "tasks" && (
        <>
          {pendingActive.length === 0 && (summary?.total ?? 0) > 0 && (
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

      {/* CHALLENGES TAB */}
      {tab === "challenges" && (
        <div className="space-y-2.5">
          {challengeGroups.map((group) => (
            <ChallengeGroupCard
              key={group.instanceId}
              group={group}
              dark={dark}
              onClick={() => setSelectedChallenge(group)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CelebrationBanner({ message }: { message: string }) {
  const particles = ["🎉", "✨", "⭐", "💪", "🔥", "✨"];
  return (
    <div className="relative">
      {particles.map((p, i) => (
        <span key={i} className="celebrate-particle"
          style={{ left: `${5 + i * 16}%`, top: "0px", animationDelay: `${i * 0.1}s` }}>
          {p}
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

function ChallengeGroupCard({ group, dark, onClick }: {
  group: ChallengeGroup; dark: boolean; onClick: () => void;
}) {
  const { icon, accent, bg } = useCategoryStyle(group.title, dark);
  const completed = group.tasks.filter((t) => t.status === "completed").length;
  const total = group.tasks.length;
  const allDone = completed === total;

  return (
    <button onClick={onClick}
      className="w-full text-left rounded-md p-4 transition-all hover:shadow-md"
      style={{ background: "var(--color-surface)", border: `1px solid ${allDone ? "var(--color-success)" : "var(--color-border)"}` }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0"
          style={{ background: allDone ? "var(--color-success-bg)" : bg }}>
          {allDone ? <CheckIcon size={18} strokeWidth={2.5} className="text-success" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary text-[14px] truncate">{group.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(completed / total) * 100}%`, background: allDone ? "var(--color-success)" : accent }} />
            </div>
            <span className="text-[11px] font-bold shrink-0"
              style={{ color: allDone ? "var(--color-success)" : accent }}>
              {completed}/{total}
            </span>
          </div>
        </div>
        <span className="text-text-tertiary text-[16px]">›</span>
      </div>
    </button>
  );
}

function ChallengeHero({ group, dark, completed, total }: {
  group: ChallengeGroup; dark: boolean; completed: number; total: number;
}) {
  const { icon, accent, bg } = useCategoryStyle(group.title, dark);
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl p-4"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: bg }}>
          {icon}
        </div>
        <div>
          <p className="font-black text-[16px] text-text-primary">{group.title}</p>
          <p className="text-[12px] font-semibold" style={{ color: accent }}>
            {completed}/{total} {completed === total ? "✅" : ""}
          </p>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${rate}%`, background: rate === 100 ? "var(--color-success)" : accent }} />
      </div>
    </div>
  );
}
