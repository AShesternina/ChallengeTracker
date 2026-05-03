import { useTranslation } from "react-i18next";
import { useThemeStore } from "../store/themeStore";
import { useCategoryStyle } from "../utils/category";
import { DailyTask } from "../store/taskStore";
import { CheckIcon, ClockIcon, UndoIcon } from "./Icons";

interface Props {
  task: DailyTask;
  onComplete: (id: number) => void;
  onSkip: (id: number) => void;
  onUndo?: (id: number) => void;
  loading?: boolean;
  showChallengeName?: boolean;
}

export default function TaskCard({ task, onComplete, onSkip, onUndo, loading, showChallengeName }: Props) {
  const { t } = useTranslation();
  const { dark } = useThemeStore();
  const { icon, accent, bg } = useCategoryStyle(task.challenge_title, dark);

  const isPending = task.status === "pending";
  const isDone = task.status === "completed";
  const isSkipped = task.status === "skipped";

  const cardBg = isDone
    ? "var(--color-success-bg)"
    : isSkipped
    ? "var(--color-surface2)"
    : "var(--color-surface)";

  const cardBorder = isDone
    ? "var(--color-success)"
    : isSkipped
    ? "var(--color-border)"
    : accent;

  return (
    <div
      className="rounded-lg p-3.5 transition-all duration-200"
      style={{
        background: cardBg,
        border: `1.5px solid ${isDone ? "var(--color-success-bg)" : isSkipped ? "var(--color-border)" : `${accent}35`}`,
        opacity: isSkipped ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Category icon or checkmark */}
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-lg"
          style={{ background: isDone ? "var(--color-success-bg)" : bg }}>
          {isDone
            ? <CheckIcon size={18} className="text-success" strokeWidth={2.5} />
            : <span>{icon}</span>
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {showChallengeName && (
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1"
              style={{ background: `${accent}18`, color: accent }}>
              {task.challenge_title}
            </span>
          )}
          <p className={`text-[14px] font-bold leading-tight ${isDone ? "line-through text-text-tertiary" : "text-text-primary"}`}>
            {task.challenge_title}
          </p>
          {task.scheduled_time && (
            <p className="flex items-center gap-1 mt-0.5 text-[11px] font-semibold"
              style={{ color: isPending ? accent : "var(--color-text-tertiary)" }}>
              <ClockIcon size={11} strokeWidth={2} />
              {task.scheduled_time.slice(0, 5)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPending && (
            <>
              <button onClick={() => onSkip(task.id)} disabled={loading}
                className="px-2.5 py-1.5 text-[12px] font-semibold rounded-sm border disabled:opacity-40 transition-colors"
                style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border-strong)", borderWidth: "1.5px" }}>
                {t("common.skip")}
              </button>
              <button onClick={() => onComplete(task.id)} disabled={loading}
                className="px-2.5 py-1.5 text-[12px] font-bold text-white rounded-sm disabled:opacity-40 transition-colors"
                style={{ background: accent }}>
                {t("common.done")}
              </button>
            </>
          )}
          {!isPending && onUndo && (
            <button onClick={() => onUndo(task.id)} disabled={loading}
              className="p-1.5 rounded-sm text-text-tertiary hover:text-text-secondary transition-colors"
              title="Undo">
              <UndoIcon size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
