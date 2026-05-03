"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";
import { Card } from "@/components/ui/Card";

type ScoreData = {
  score: number;
  label: string;
  trend: string;
  summary: string;
  breakdown?: {
    transactionVolume: number;
    consistency: number;
    incomingStrength: number;
    cashflowBalance: number;
    recency: number;
  };
  stats?: {
    incomingTotal: number;
    outgoingTotal: number;
    transactionCount: number;
    activeDays: number;
    incomingCount: number;
    outgoingCount: number;
  };
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 55) return "text-indigo-600";
  if (score >= 30) return "text-amber-600";
  return "text-rose-600";
}

export default function ScorePage() {
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
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load score.");
        }

        setData(json);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load score."
        );
      } finally {
        setLoading(false);
      }
    }

    if (mounted && isConnected && address) {
      load();
    } else {
      setData(null);
      setError("");
    }
  }, [mounted, address, isConnected]);

  return (
    <main className="space-y-6">
      <Card className="border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
              PocketFlow Score Engine
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Proof-of-Cashflow Score
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Understand how wallet activity becomes a financial identity
              signal using volume, consistency, balance, and recency.
            </p>
          </div>

          <div className="w-full max-w-md">
            <WalletConnect />
          </div>
        </div>
      </Card>

      {!mounted && (
        <Card>
          <p className="text-sm text-slate-500">Loading score page...</p>
        </Card>
      )}

      {mounted && !isConnected && (
        <Card>
          <p className="text-sm text-slate-600">
            Connect your wallet to view your PocketFlow score.
          </p>
        </Card>
      )}

      {loading && (
        <Card>
          <p className="text-sm text-slate-500">Loading score...</p>
        </Card>
      )}

      {error && (
        <Card className="border-rose-100 bg-rose-50">
          <p className="text-sm text-rose-700">{error}</p>
        </Card>
      )}

      {mounted && isConnected && data && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <p className="text-sm text-slate-500">Your current score</p>

              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-7xl font-bold ${scoreColor(data.score)}`}>
                    {data.score}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {data.label} • {data.trend}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Based on verified PocketFlow wallet activity.
                  </p>
                </div>

                <Link
                  href="/profile"
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Manage Profile
                </Link>
              </div>

              <div className="mt-6 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{ width: `${data.score}%` }}
                />
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-slate-950">
                Score Meaning
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                A higher score means your wallet shows stronger, more consistent
                and healthier cashflow activity.
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <p>80 to 100: Strong cashflow signal</p>
                <p>55 to 79: Growing profile</p>
                <p>30 to 54: Early or uneven activity</p>
                <p>0 to 29: Limited activity</p>
              </div>
            </Card>
          </div>

          {data.stats && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <p className="text-sm text-slate-500">Incoming Total</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {data.stats.incomingTotal.toFixed(2)}
                </p>
                <p className="text-sm text-indigo-600">USDC</p>
              </Card>

              <Card>
                <p className="text-sm text-slate-500">Outgoing Total</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {data.stats.outgoingTotal.toFixed(2)}
                </p>
                <p className="text-sm text-indigo-600">USDC</p>
              </Card>

              <Card>
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {data.stats.transactionCount}
                </p>
                <p className="text-sm text-slate-500">
                  {data.stats.incomingCount} in / {data.stats.outgoingCount} out
                </p>
              </Card>

              <Card>
                <p className="text-sm text-slate-500">Active Days</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {data.stats.activeDays}
                </p>
                <p className="text-sm text-slate-500">cashflow days</p>
              </Card>
            </div>
          )}

          <Card>
            <h2 className="text-xl font-semibold text-slate-950">
              How your score is calculated
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Transaction Volume", "Measures value flowing through wallet."],
                ["Consistency", "Rewards repeated activity over time."],
                ["Incoming Strength", "Tracks incoming payment activity."],
                ["Flow Balance", "Compares inflow against spending."],
                ["Recency", "Recent payments keep the profile active."],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50">
            <h2 className="text-xl font-semibold text-slate-950">
              Profile Insight
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {data.summary}
            </p>
          </Card>

          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </Link>
        </>
      )}
    </main>
  );
}