"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

export default function AutoIncomingSync({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { address, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("Ready to sync");
  const [error, setError] = useState("");
  const [lastImported, setLastImported] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runningRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function runSync() {
    if (!address || runningRef.current) return;

    try {
      runningRef.current = true;
      setIsRunning(true);
      setError("");
      setStatus("Checking for incoming payments...");

      const res = await fetch("/api/transactions/import-incoming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync incoming activity.");
      }

      const imported = data.imported ?? 0;
      const fallbackDetected = Boolean(data.fallbackDetected);
      const fallbackAmount = data.fallbackAmount ?? "0";

      setLastImported(imported);

      if (imported > 0) {
        setStatus(`Imported ${imported} incoming payment(s).`);
      } else if (fallbackDetected) {
        setStatus(`Detected ${fallbackAmount} USDC balance increase.`);
      } else {
        setStatus("No new incoming payments found.");
      }

      window.dispatchEvent(new Event("pocketflow-activity-updated"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sync incoming activity.";
      setError(message);
      setStatus("Sync failed.");
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;

    if (!isConnected || !address) {
      setStatus("Ready to sync");
      setError("");
      setLastImported(null);
      return;
    }

    runSync();

    const interval = setInterval(() => {
      runSync();
    }, 20000);

    return () => clearInterval(interval);
  }, [mounted, address, isConnected]);

  if (!mounted) return null;
  if (!isConnected || !address) return null;

  return (
    <div
      suppressHydrationWarning
      className={`rounded-2xl border border-slate-200 bg-slate-50 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Incoming Payment Auto-Sync
          </p>
          <p className="text-xs text-slate-500">{status}</p>
        </div>

        <button
          type="button"
          onClick={runSync}
          disabled={isRunning}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-50"
        >
          {isRunning ? "Checking..." : "Check Now"}
        </button>
      </div>

      {lastImported !== null && (
        <p className="mt-2 text-xs text-slate-500">
          Latest import result: {lastImported} event payment(s)
        </p>
      )}

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}