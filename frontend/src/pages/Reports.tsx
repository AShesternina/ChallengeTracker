import { useEffect, useState } from "react";
import { format } from "date-fns";
import { reportsApi } from "../services/api";

interface DayStats {
  date: string;
  total: number;
  completed: number;
  completion_rate: number;
}

interface MonthlyReport {
  year: number;
  month: number;
  days: DayStats[];
  total_tasks: number;
  total_completed: number;
  completion_rate: number;
}

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await reportsApi.monthly(year, month);
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const monthName = format(new Date(year, month - 1), "MMMM yyyy");

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          ←
        </button>
        <span className="font-semibold text-gray-700">{monthName}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          →
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}

      {report && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-gray-800">{report.total_tasks}</p>
              <p className="text-xs text-gray-500">Total tasks</p>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-green-600">{report.total_completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-primary-600">
                {Math.round(report.completion_rate * 100)}%
              </p>
              <p className="text-xs text-gray-500">Rate</p>
            </div>
          </div>

          {/* Heatmap-style calendar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Daily completion</h3>
            <div className="grid grid-cols-7 gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 pb-1">{d}</div>
              ))}
              {/* Offset for first day of month */}
              {Array.from({ length: (new Date(year, month - 1, 1).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {report.days.map((day) => {
                const rate = day.total > 0 ? day.completion_rate : -1;
                const dayNum = Number(day.date.split("-")[2]);
                const color =
                  rate < 0 ? "bg-gray-100"
                  : rate >= 1 ? "bg-green-500"
                  : rate >= 0.5 ? "bg-green-300"
                  : "bg-red-200";
                return (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-sm ${color} flex items-center justify-center`}
                    title={`${day.date}: ${day.completed}/${day.total}`}
                  >
                    <span className="text-xs text-white font-medium">{dayNum}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> 100%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-300 inline-block" /> 50%+</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> &lt;50%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> No tasks</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
