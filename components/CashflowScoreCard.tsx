"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardTitle } from "@/components/ui/Card";

type ScoreData = {
  score: number;
  label: string;
  trend: string;
  summary: string;
  breakdown: {
    transactionVolume: number;
    consistency: number;
    incomingStrength: number;
    cashflowBalance: number;
    recency: number;
  };
  stats: {
    incomingTotal: number;
    outgoingTotal: number;
    transactionCount: number;
    activeDays: number;
    incomingCount: number;
    outgoingCount: number;
    lastActivityAt: string | null;
  };
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 55) return "text-indigo-600";
  if (score >= 30) return "text-amber-600";
  return "text-rose-600";
}

function getTransactionTier(transactionCount: number) {
  if (transactionCount >= 500) return "500+ transaction history";
  if (transactionCount >= 200) return "Deep behavior signal";
  if (transactionCount >= 100) return "Strong behavior signal";
  if (transactionCount >= 50) return "Developing behavior signal";
  if (transactionCount >= 10) return "Early behavior signal";
  if (transactionCount >= 1) return "Limited behavior signal";
  return "No behavior signal yet";
}

const breakdownItems = [
  { key: "transactionVolume", label: "Activity Depth", max: 50 },
  { key: "consistency", label: "Consistency", max: 20 },
  { key: "incomingStrength", label: "Incoming Strength", max: 15 },
  { key: "cashflowBalance", label: "Flow Balance", max: 10 },
  { key: "recency", label: "Recency", max: 5 },
] as const;

export default function CashflowScoreCard() {
  const { address, isConnected } = useAccount();

  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  async function load() {
    if (!address) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/score?wallet=${address}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to fetch behavior signal.");
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load behavior signal."
      );
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
    <Card className="h-full">
      <CardTitle
        title="Behavior Signal"
        subtitle="A strict signal built from transaction depth, consistency, and flow quality."
      />

      {!isConnected && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Connect wallet to view your behavior signal.
        </div>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Reading cashflow behavior...
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Current behavior score</p>

            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-5xl font-semibold leading-none ${getScoreColor(
                    data.score
                  )}`}
                >
                  {data.score}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {getTransactionTier(data.stats.transactionCount)}
                </p>
              </div>

              <div className="space-y-2 text-right">
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                  {data.label}
                </span>
                <p className="text-sm text-slate-500">{data.trend}</p>
              </div>
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-indigo-600"
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-sm leading-6 text-slate-600">{data.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Incoming Flow</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {data.stats.incomingTotal.toFixed(2)} USDC
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Outgoing Flow</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {data.stats.outgoingTotal.toFixed(2)} USDC
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {breakdownItems.map((item) => {
              const value = data.breakdown[item.key];

              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {value}/{item.max}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Tracked Activity</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {data.stats.transactionCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Active days: {data.stats.activeDays}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Flow Mix</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {data.stats.incomingCount} in / {data.stats.outgoingCount} out
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Last activity:{" "}
                {data.stats.lastActivityAt
                  ? new Date(data.stats.lastActivityAt).toLocaleDateString()
                  : "No activity yet"}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}