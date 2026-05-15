"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Activity = {
  direction: "incoming" | "outgoing";
  amount: string;
  createdAt: string;
};

type ChartPoint = {
  date: string;
  incoming: number;
  outgoing: number;
};

export default function ActivityChart() {
  const { address, isConnected } = useAccount();

  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!address) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/transactions?wallet=${address}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Failed to fetch movement data.");
        }

        const activities: Activity[] = result.activities || [];
        const grouped: Record<string, ChartPoint> = {};

        activities.forEach((tx) => {
          const date = new Date(tx.createdAt).toISOString().slice(0, 10);

          if (!grouped[date]) {
            grouped[date] = {
              date,
              incoming: 0,
              outgoing: 0,
            };
          }

          if (tx.direction === "incoming") {
            grouped[date].incoming += Number(tx.amount);
          } else {
            grouped[date].outgoing += Number(tx.amount);
          }
        });

        const sorted = Object.values(grouped).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        setData(sorted);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load cashflow movement."
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
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          Cashflow Movement
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          A quiet timeline of incoming flow versus outgoing payments.
        </p>
      </div>

      {!isConnected && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Connect wallet to view cashflow movement.
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Reading movement pattern...</p>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isConnected && data.length > 0 && (
        <div className="h-72 min-h-72 w-full">
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="incoming"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="outgoing"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {isConnected && data.length === 0 && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">
            No movement pattern yet
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Incoming and outgoing activity will appear here once PocketFlow has
            cashflow data to read.
          </p>
        </div>
      )}
    </div>
  );
}