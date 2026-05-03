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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      if (!address) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/transactions?wallet=${address}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Failed to fetch activity.");
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
        const message =
          err instanceof Error ? err.message : "Failed to load chart.";
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
      setData([]);
    }

    window.addEventListener("pocketflow-activity-updated", handleActivityUpdate);

    return () => {
      window.removeEventListener(
        "pocketflow-activity-updated",
        handleActivityUpdate
      );
    };
  }, [mounted, address, isConnected]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Cashflow Trend</h2>
        <p className="text-sm text-slate-500">
          Incoming vs outgoing activity over time
        </p>
      </div>

      {!mounted && <p className="text-sm text-slate-500">Loading chart...</p>}
      {mounted && !isConnected && <p>Connect wallet to view chart.</p>}
      {loading && <p>Loading chart...</p>}
      {error && <p className="text-rose-600 text-sm">{error}</p>}

      {mounted && data.length > 0 && (
        <div className="h-72 min-h-[288px] w-full">
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
              />
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

      {mounted && data.length === 0 && !loading && !error && (
        <p className="text-sm text-slate-500">No activity data yet.</p>
      )}
    </div>
  );
}