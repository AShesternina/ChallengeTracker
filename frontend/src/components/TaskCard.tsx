import { useTranslation } from "react-i18next";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { DailyTask } from "../store/taskStore";
import { CheckIcon, ClockIcon, UndoIcon } from "./Icons";
import { translateTemplateName } from "../utils/templateTranslations";

interface Props {
  task: DailyTask;
  onComplete?: (id: number) => void;
  onSkip?: (id: number) => void;
  onUndo?: (id: number) => void;
  loading?: boolean;
  showChallengeName?: boolean;
  readOnly?: boolean;
}

export default function TaskCard({ task, onComplete, onSkip, onUndo, loading, showChallengeName, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const { dark } = useThemeStore();
  const challengeTitle = translateTemplateName(task.challenge_title, i18n.language);
  const { icon, accent, bg } = useCategoryStyle(task.challenge_title, dark);

  const isPending = task.status === "pending";
  const isDone = task.status === "completed";
  const isSkipped = task.status === "skipped";
  const isAllDay = task.type === "all_day";
  const hasSeq = task.sequence_number != null && task.total_count != null;
  const isCancelled = task.challenge_status === "cancelled";
  const isPaused = task.challenge_status === "paused";
  const isInactive = isCancelled || isPaused;

  const statusLabel = isCancelled
    ? t("task.cancelled")
    : isPaused ? t("task.paused")
    : isDone ? t("daily.status_completed")
    : isSkipped ? t("daily.status_skipped")
    : t("daily.status_pending");

  const statusBadgeStyle = {
    background: isInactive || isSkipped ? "var(--color-surface2)" : isDone ? "var(--color-success-bg)" : `${accent}18`,
    color: isInactive || isSkipped ? "var(--color-text-tertiary)" : isDone ? "var(--color-success)" : accent,
  };

  const cardBg = isDone
    ? "var(--color-success-bg)"
    : isSkipped
    ? "var(--color-surface2)"
    : "var(--color-surface)";

  return (
    <div
      className="rounded-lg p-3.5 transition-all duration-200"
      style={{
        background: cardBg,
        border: `1.5px solid ${isDone ? "var(--color-success-bg)" : isSkipped ? "var(--color-border)" : isInactive ? "var(--color-border)" : `${accent}35`}`,
        opacity: isSkipped || isInactive ? 0.55 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-lg"
          style={{ background: isDone ? "var(--color-success-bg)" : bg }}>
          {isDone
            ? <CheckIcon size={18} className="text-success" strokeWidth={2.5} />
            : <span>{icon}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          {showChallengeName && (
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1"
              style={{ background: `${accent}18`, color: accent }}>
              {challengeTitle}
            </span>
          )}
          <p className={`text-[14px] font-bold leading-tight ${isDone ? "line-through text-text-tertiary" : "text-text-primary"}`}>
            {challengeTitle}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {task.scheduled_time && (
              <span className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: isPending ? accent : "var(--color-text-tertiary)" }}>
                <ClockIcon size={11} strokeWidth={2} />
                {task.scheduled_time.slice(0, 5)}
              </span>
            )}
            {hasSeq && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${accent}18`, color: accent }}>
                {task.sequence_number} {t("task.of")} {task.total_count}
              </span>
            )}
            {isAllDay && !hasSeq && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--color-surface2)", color: "var(--color-text-tertiary)" }}>
                {t("task.all_day")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {readOnly || isInactive ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={statusBadgeStyle}>
              {statusLabel}
            </span>
          ) : (
            <>
              {isPending && (
                <>
                  <button onClick={() => onSkip?.(task.id)} disabled={loading}
                    className="px-2.5 py-1.5 text-[12px] font-semibold rounded-sm border disabled:opacity-40 transition-colors"
                    style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border-strong)", borderWidth: "1.5px" }}>
                    {t("common.skip")}
                  </button>
                  <button onClick={() => onComplete?.(task.id)} disabled={loading}
                    className="px-2.5 py-1.5 text-[12px] font-bold text-white rounded-sm disabled:opacity-40 transition-colors"
                    style={{ background: accent }}>
                    {t("common.done")}
                  </button>
                </>
              )}
              {!isPending && onUndo && (
                <button onClick={() => onUndo(task.id)} disabled={loading}
                  className="p-1.5 rounded-sm text-text-tertiary hover:text-text-secondary transition-colors"
                  title={t("task.undo")}>
                  <UndoIcon size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
