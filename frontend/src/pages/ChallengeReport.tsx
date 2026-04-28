import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { reportsApi } from "../services/api";

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
}

export default function ChallengeReport() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    reportsApi.challenge(Number(id))
      .then((r) => setReport(r.data))
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (error) return <div className="text-center text-red-500 py-16">{error}</div>;
  if (!report) return null;

  const rate = Math.round(report.completion_rate * 100);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-3">
        <Link to="/challenges" className="text-gray-400 hover:text-gray-600">←</Link>
        <h2 className="text-xl font-bold text-gray-800 truncate">{report.challenge_title}</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total tasks" value={report.total_tasks} />
          <Stat label="Completed" value={report.completed_tasks} color="text-green-600" />
          <Stat label="Skipped" value={report.skipped_tasks} color="text-gray-400" />
          <Stat label="Rate" value={`${rate}%`} color={rate >= 80 ? "text-green-600" : rate >= 50 ? "text-yellow-600" : "text-red-500"} />
          <Stat label="Current streak" value={`${report.current_streak} 🔥`} />
          <Stat label="Best streak" value={`${report.longest_streak} 🏆`} />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm text-gray-500 mb-1">Period</p>
        <p className="font-medium text-gray-800">
          {report.start_date} → {report.end_date}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Completion</span>
          <span className="font-semibold">{rate}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-gray-800" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
