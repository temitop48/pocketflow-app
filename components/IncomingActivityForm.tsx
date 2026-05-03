"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";

export default function IncomingActivityForm() {
  const { address, isConnected } = useAccount();

  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setStatus("");
    setError("");

    if (!isConnected || !address) {
      setError("Connect wallet first.");
      return;
    }

    if (!counterparty || !isAddress(counterparty)) {
      setError("Enter a valid sender address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!txHash.trim()) {
      setError("Enter the transaction hash.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/transactions/manual-incoming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: address,
          counterparty,
          amount,
          txHash,
          status: "confirmed",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save incoming activity.");
      }

      setStatus("Incoming activity saved successfully.");
      setCounterparty("");
      setAmount("");
      setTxHash("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save incoming activity.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Sender Address
          </label>
          <input
            type="text"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Amount (USDC)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25.00"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Transaction Hash
        </label>
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving Incoming Activity..." : "Save Incoming Activity"}
      </button>

      {status && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          {status}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}