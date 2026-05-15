"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type Activity = {
  id: string;
  wallet: string;
  counterparty: string;
  direction: string;
  amount: string;
  txHash: string;
  status: string;
  aiVerdict?: string | null;
  aiConfidence?: number | null;
  aiReason?: string | null;
  createdAt: string;
};

function shortHash(value: string) {
  if (!value || value === "balance_adjustment") return "";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function verdictLabel(verdict?: string | null) {
  if (verdict === "safe") return "Manageable";
  if (verdict === "risky") return "Needs review";
  if (verdict === "not_recommended") return "Elevated risk";
  return null;
}

function verdictClass(verdict?: string | null) {
  if (verdict === "safe")
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (verdict === "risky")
    return "border-amber-100 bg-amber-50 text-amber-700";
  if (verdict === "not_recommended")
    return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function RecentActivity() {
  const { address, isConnected } = useAccount();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!address) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/transactions?wallet=${address}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load financial timeline.");
        }

        setActivities(data.activities || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load financial timeline."
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
    <div className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Financial Timeline
          </h2>
          <p className="text-sm text-slate-500">
            Payments, sync events, and payment review notes.
          </p>
        </div>

        {activities.length > 0 && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {activities.length} records
          </span>
        )}
      </div>

      {!isConnected && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Connect wallet to view your financial timeline.
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Reading financial timeline...</p>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isConnected && !loading && !error && activities.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">
            No timeline yet
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Send or receive funds to start building your financial behavior
            history.
          </p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((item) => {
            const isFallback = item.txHash === "balance_adjustment";
            const isIncoming = item.direction === "incoming";
            const aiLabel = verdictLabel(item.aiVerdict);

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-indigo-100 hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isIncoming
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {isIncoming ? "Incoming flow" : "Outgoing payment"}
                    </span>

                    {!isIncoming && aiLabel && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${verdictClass(
                          item.aiVerdict
                        )}`}
                      >
                        {aiLabel}
                      </span>
                    )}

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {item.status}
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-lg font-bold text-slate-950">
                      {isIncoming ? "+" : "-"}
                      {item.amount} USDC
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {isIncoming ? "From" : "To"}
                    </p>
                    <p className="mt-1 break-all text-slate-700">
                      {isFallback
                        ? "Auto-detected balance sync"
                        : item.counterparty}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Transaction Reference
                    </p>
                    <p className="mt-1 break-all text-slate-700">
                      {isFallback
                        ? "No onchain transaction reference"
                        : shortHash(item.txHash)}
                    </p>
                  </div>
                </div>

                {!isIncoming && item.aiReason && (
                  <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                        Payment Review Note
                      </p>

                      {item.aiConfidence !== null &&
                        item.aiConfidence !== undefined && (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                            {item.aiConfidence}% confidence
                          </span>
                        )}
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {item.aiReason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}