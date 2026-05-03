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

      setLoading(true);

      try {
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

          if (tx.direction === "incoming") {
            incoming += amount;
          } else {
            outgoing += amount;
          }

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

  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Activity Summary</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cashflow activity plus AI payment review insights.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Incoming</p>
              <p className="text-lg font-semibold">
                {stats.incoming.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Outgoing</p>
              <p className="text-lg font-semibold">
                {stats.outgoing.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Transactions</p>
              <p className="text-lg font-semibold">{stats.count}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-700">
                  AI Payment Agent
                </p>
                <p className="text-xs text-slate-500">
                  Reviews saved from outgoing payments.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                {stats.aiReviewed} reviewed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Safe</p>
                <p className="text-lg font-bold text-emerald-600">
                  {stats.aiSafe}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Risky</p>
                <p className="text-lg font-bold text-amber-600">
                  {stats.aiRisky}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Blocked</p>
                <p className="text-lg font-bold text-rose-600">
                  {stats.aiNotRecommended}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs text-slate-400">Avg confidence</p>
                <p className="text-lg font-bold text-slate-900">
                  {stats.avgConfidence}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              {stats.incoming > stats.outgoing
                ? "You are net positive. Your inflow exceeds your spending."
                : stats.incoming < stats.outgoing
                  ? "Your spending is higher than your inflow. Monitor cashflow closely."
                  : "Your inflow and outflow are balanced."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}