import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { challengesApi } from "../services/api";

interface ChallengeInstance {
  id: number;
  challenge_id: number;
  challenge: { id: number; title: string; description: string | null; type: string };
  start_date: string;
  end_date: string;
  status: string;
}

const statusColor = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function Challenges() {
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    challengesApi.my().then((r) => setInstances(r.data)).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this challenge?")) return;
    setCancelling(id);
    try {
      await challengesApi.cancel(id);
      setInstances((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "cancelled" } : i))
      );
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Challenges</h2>
        <Link
          to="/challenges/new"
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          + New
        </Link>
      </div>

      {instances.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🎯</p>
          <p className="font-medium text-gray-600">No challenges yet</p>
          <Link to="/challenges/new" className="text-sm text-primary-600 hover:underline mt-1 block">
            Start your first challenge →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {instances.map((instance) => (
          <div key={instance.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{instance.challenge.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      statusColor[instance.status as keyof typeof statusColor] || "bg-gray-100"
                    }`}
                  >
                    {instance.status}
                  </span>
                </div>
                {instance.challenge.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{instance.challenge.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(instance.start_date), "d MMM")} →{" "}
                  {format(new Date(instance.end_date), "d MMM yyyy")}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  to={`/reports/challenge/${instance.id}`}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Report
                </Link>
                {instance.status === "active" && (
                  <button
                    onClick={() => handleCancel(instance.id)}
                    disabled={cancelling === instance.id}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
