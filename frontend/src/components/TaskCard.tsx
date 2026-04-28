import { useTranslation } from "react-i18next";
import { DailyTask } from "../store/taskStore";

interface Props {
  task: DailyTask;
  onComplete: (id: number) => void;
  onSkip: (id: number) => void;
  loading?: boolean;
}

const statusColors = {
  pending: "border-gray-200 bg-white",
  completed: "border-green-200 bg-green-50",
  skipped: "border-gray-200 bg-gray-50 opacity-60",
};

export default function TaskCard({ task, onComplete, onSkip, loading }: Props) {
  const { t } = useTranslation();
  const isPending = task.status === "pending";

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${statusColors[task.status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{task.challenge_title}</p>
          {task.scheduled_time && (
            <p className="text-sm text-gray-500 mt-0.5">
              ⏰ {task.scheduled_time.slice(0, 5)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1 capitalize">{task.type.replace("_", " ")}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.status === "completed" && (
            <span className="text-green-600 font-bold text-lg">✓</span>
          )}
          {task.status === "skipped" && (
            <span className="text-gray-400 text-sm">{t("common.skip").toLowerCase()}</span>
          )}
          {isPending && (
            <>
              <button
                onClick={() => onSkip(task.id)}
                disabled={loading}
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {t("common.skip")}
              </button>
              <button
                onClick={() => onComplete(task.id)}
                disabled={loading}
                className="px-3 py-1.5 text-xs text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
              >
                {t("common.done")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
