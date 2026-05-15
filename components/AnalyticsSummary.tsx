"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type Activity = {
  direction: "incoming" | "outgoing";
  amount: string;
  aiVerdict?: "safe" | "risky" | "not_recommended" | null;
  aiConfidence?: number | null;
};

export default function AnalyticsSummary() {
  const { address, isConnected } = useAccount();

  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    count: 0,
    aiReviewed: 0,
    aiSafe: 0,
    aiRisky: 0,
    aiNotRecommended: 0,
    avgConfidence: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!address) return;

      try {
        setLoading(true);

        const res = await fetch(`/api/transactions?wallet=${address}`);
        const result = await res.json();

        const activities: Activity[] = result.activities || [];

        let incoming = 0;
        let outgoing = 0;
        let aiReviewed = 0;
        let aiSafe = 0;
        let aiRisky = 0;
        let aiNotRecommended = 0;
        let confidenceTotal = 0;

        activities.forEach((tx) => {
          const amount = Number(tx.amount);

          if (tx.direction === "incoming") incoming += amount;
          if (tx.direction === "outgoing") outgoing += amount;

          if (tx.direction === "outgoing" && tx.aiVerdict) {
            aiReviewed += 1;

            if (tx.aiVerdict === "safe") aiSafe += 1;
            if (tx.aiVerdict === "risky") aiRisky += 1;
            if (tx.aiVerdict === "not_recommended") aiNotRecommended += 1;

            if (typeof tx.aiConfidence === "number") {
              confidenceTotal += tx.aiConfidence;
            }
          }
        });

        setStats({
          incoming,
          outgoing,
          count: activities.length,
          aiReviewed,
          aiSafe,
          aiRisky,
          aiNotRecommended,
          avgConfidence:
            aiReviewed > 0 ? Math.round(confidenceTotal / aiReviewed) : 0,
        });
      } finally {
        setLoading(false);
      }
    }

    function handleActivityUpdate() {
      load();
    }

    if (isConnected && address) {
      load();
    }

    window.addEventListener("pocketflow-activity-updated", handleActivityUpdate);

    return () => {
      window.removeEventListener(
        "pocketflow-activity-updated",
        handleActivityUpdate
      );
    };
  }, [address, isConnected]);

  const netFlow = stats.incoming - stats.outgoing;

  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          Cashflow Health
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          A calm read on inflow, outflow, and reviewed payment pressure.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Reading cashflow health...</p>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Inflow</p>
              <p className="text-lg font-semibold text-slate-950">
                {stats.incoming.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Outflow</p>
              <p className="text-lg font-semibold text-slate-950">
                {stats.outgoing.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Net Flow</p>
              <p
                className={`text-lg font-semibold ${
                  netFlow >= 0 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {netFlow.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-700">
                  Payment Intelligence
                </p>
                <p className="text-xs text-slate-500">
                  Reviewed outgoing payments before wallet signing.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                {stats.aiReviewed} reviewed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Manageable</p>
                <p className="text-lg font-bold text-emerald-600">
                  {stats.aiSafe}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Needs review</p>
                <p className="text-lg font-bold text-amber-600">
                  {stats.aiRisky}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Elevated risk</p>
                <p className="text-lg font-bold text-rose-600">
                  {stats.aiNotRecommended}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Confidence</p>
                <p className="text-lg font-bold text-slate-900">
                  {stats.avgConfidence}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-600">
              {stats.count === 0
                ? "No cashflow pattern yet. Activity will appear here once funds move."
                : stats.incoming > stats.outgoing
                  ? "Your inflow is currently stronger than your outflow. That improves your financial behavior signal."
                  : stats.incoming < stats.outgoing
                    ? "Your outflow is currently higher than your inflow. PocketFlow will treat larger payments with more caution."
                    : "Your inflow and outflow are currently balanced."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}