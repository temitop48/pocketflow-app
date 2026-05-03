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
  if (transactionCount >= 500) return "500+ transactions";
  if (transactionCount >= 200) return "200 - 499 transactions";
  if (transactionCount >= 100) return "100 - 199 transactions";
  if (transactionCount >= 50) return "50 - 99 transactions";
  if (transactionCount >= 10) return "10 - 49 transactions";
  if (transactionCount >= 1) return "1 - 9 transactions";
  return "No transactions yet";
}

const breakdownItems = [
  { key: "transactionVolume", label: "Activity Volume", max: 50 },
  { key: "consistency", label: "Consistency", max: 20 },
  { key: "incomingStrength", label: "Income Strength", max: 15 },
  { key: "cashflowBalance", label: "Flow Balance", max: 10 },
  { key: "recency", label: "Recent Activity", max: 5 },
] as const;

export default function CashflowScoreCard() {
  const { address, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      if (!address) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/score?wallet=${address}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Failed to fetch score.");
        }

        setData(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load score.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    function handleActivityUpdate() {
      load();
    }

    if (mounted && isConnected && address) {
      load();
    } else {
      setData(null);
      setError("");
    }

    window.addEventListener("pocketflow-activity-updated", handleActivityUpdate);

    return () => {
      window.removeEventListener(
        "pocketflow-activity-updated",
        handleActivityUpdate
      );
    };
  }, [mounted, address, isConnected]);

  if (!mounted) {
    return (
      <Card className="h-full">
        <CardTitle
          title="Cashflow Score"
          subtitle="A signal built from activity, consistency, and flow behavior."
        />
        <p className="mt-4 text-sm text-slate-500">Loading score...</p>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardTitle
        title="Cashflow Score"
        subtitle="A stricter signal built from transaction depth, consistency, and flow behavior."
      />

      {!isConnected && (
        <p className="mt-4 text-sm">Connect wallet to view your score.</p>
      )}

      {loading && <p className="mt-4 text-sm">Calculating score...</p>}

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {data && (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Current score</p>

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
                <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-sm font-medium">
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

          <p className="text-sm leading-6 text-slate-600">{data.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Incoming Total</p>
              <p className="mt-2 text-2xl font-semibold">
                {data.stats.incomingTotal.toFixed(2)} USDC
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Outgoing Total</p>
              <p className="mt-2 text-2xl font-semibold">
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
                  <p className="mt-2 text-lg font-semibold">
                    {value}/{item.max}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Transactions</p>
              <p className="mt-2 text-2xl font-semibold">
                {data.stats.transactionCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Active days: {data.stats.activeDays}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Activity Mix</p>
              <p className="mt-2 text-2xl font-semibold">
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