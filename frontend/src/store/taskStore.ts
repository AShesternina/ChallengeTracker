import { create } from "zustand";

export interface DailyTask {
  id: number;
  challenge_instance_id: number;
  challenge_title: string;
  date: string;
  scheduled_time: string | null;
  type: "single" | "multi" | "all_day";
  status: "pending" | "completed" | "skipped";
  completed_at: string | null;
  sequence_number: number | null;
  total_count: number | null;
}

export interface DailySummary {
  date: string;
  total: number;
  completed: number;
  skipped: number;
  pending: number;
  tasks: DailyTask[];
}

interface TaskState {
  summary: DailySummary | null;
  loading: boolean;
  setSummary: (s: DailySummary) => void;
  setLoading: (v: boolean) => void;
  updateTask: (updated: DailyTask) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  summary: null,
  loading: false,
  setSummary: (s) => set({ summary: s }),
  setLoading: (v) => set({ loading: v }),
  updateTask: (updated) =>
    set((state) => {
      if (!state.summary) return state;
      const tasks = state.summary.tasks.map((t) =>
        t.id === updated.id ? updated : t
      );
      const completed = tasks.filter((t) => t.status === "completed").length;
      const skipped = tasks.filter((t) => t.status === "skipped").length;
      return {
        summary: {
          ...state.summary,
          tasks,
          completed,
          skipped,
          pending: tasks.length - completed - skipped,
        },
      };
    }),
}));
