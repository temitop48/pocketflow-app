"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

type Activity = {
  direction: "incoming" | "outgoing";
  amount: string;
};

type FinancialState =
  | "Stable"
  | "Growing"
  | "Volatile"
  | "High Risk";

function getStateConfig(state: FinancialState) {
  switch (state) {
    case "Growing":
      return {
        badge:
          "border-emerald-100 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
        title: "Cashflow is strengthening",
      };

    case "Volatile":
      return {
        badge:
          "border-amber-100 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
        title: "Cashflow volatility detected",
      };

    case "High Risk":
      return {
        badge:
          "border-rose-100 bg-rose-50 text-rose-700",
        dot: "bg-rose-500",
        title: "Financial pressure detected",
      };

    default:
      return {
        badge:
          "border-indigo-100 bg-indigo-50 text-indigo-700",
        dot: "bg-indigo-500",
        title: "Financial activity appears balanced",
      };
  }
}

export default function FinancialStateCard() {
  const { address, isConnected } = useAccount();

  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    transactions: 0,
  });

  useEffect(() => {
    async function load() {
      if (!address) return;

      try {
        setLoading(true);

        const res = await fetch(
          `/api/transactions?wallet=${address}`
        );

        const data = await res.json();

        const activities: Activity[] =
          data.activities || [];

        let incoming = 0;
        let outgoing = 0;

        activities.forEach((tx) => {
          const amount = Number(tx.amount);

          if (tx.direction === "incoming") {
            incoming += amount;
          } else {
            outgoing += amount;
          }
        });

        setStats({
          incoming,
          outgoing,
          transactions: activities.length,
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

    window.addEventListener(
      "pocketflow-activity-updated",
      handleActivityUpdate
    );

    return () => {
      window.removeEventListener(
        "pocketflow-activity-updated",
        handleActivityUpdate
      );
    };
  }, [address, isConnected]);

  const financialState = useMemo<FinancialState>(() => {
    const netFlow = stats.incoming - stats.outgoing;

    if (
      stats.outgoing > stats.incoming * 1.5 &&
      stats.transactions >= 5
    ) {
      return "High Risk";
    }

    if (
      stats.transactions >= 8 &&
      Math.abs(netFlow) < stats.incoming * 0.15
    ) {
      return "Stable";
    }

    if (
      stats.incoming > stats.outgoing &&
      stats.transactions >= 5
    ) {
      return "Growing";
    }

    return "Volatile";
  }, [stats]);

  const config = getStateConfig(financialState);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Financial State
          </p>

          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${config.dot}`}
            />

            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              {financialState}
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-600">
            {config.title}
          </p>
        </div>

        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.badge}`}
        >
          AI monitored
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Incoming
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {stats.incoming.toFixed(2)}
          </p>

          <p className="text-sm text-slate-500">
            stablecoin inflow
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Outgoing
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {stats.outgoing.toFixed(2)}
          </p>

          <p className="text-sm text-slate-500">
            payment outflow
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Activity
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {stats.transactions}
          </p>

          <p className="text-sm text-slate-500">
            tracked transactions
          </p>
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Analyzing financial behavior...
        </p>
      )}
    </div>
  );
}