"use client";

import { useEffect, useMemo, useState } from "react";

type Verdict = "safe" | "risky" | "not_recommended";

export type PaymentAnalysis = {
  verdict: Verdict;
  confidence: number;
  reason: string;
  balanceSignal: "healthy" | "low" | "unknown";
  cashflowSignal: "positive" | "weak" | "negative" | "unknown";
  scoreImpact: "low" | "medium" | "high";
  stats: {
    incoming30d: number;
    outgoing30d: number;
    netFlow30d: number;
    transactionCount30d: number;
  };
};

type Props = {
  wallet?: string;
  amount?: string;
  recipient?: string;
  balance?: number;
  guardMode?: boolean;
  minimumBalancePercent?: number;
  onAnalysisChange?: (analysis: PaymentAnalysis | null) => void;
};

function shortenAddress(address?: string) {
  if (!address) return "0x...";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function AIPaymentAgentCard({
  wallet,
  amount = "",
  recipient = "",
  balance,
  guardMode = false,
  minimumBalancePercent = 20,
  onAnalysisChange,
}: Props) {
  const [analysis, setAnalysis] = useState<PaymentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericAmount = useMemo(() => Number(amount || 0), [amount]);

  const quickVerdict = useMemo<Verdict | null>(() => {
    if (!numericAmount || !balance) return null;

    const ratio = numericAmount / balance;
    const remainingPercent = ((balance - numericAmount) / balance) * 100;

    if (ratio > 1) return "not_recommended";
    if (guardMode && remainingPercent < minimumBalancePercent) return "risky";
    if (ratio > 0.6) return "risky";

    return "safe";
  }, [numericAmount, balance, guardMode, minimumBalancePercent]);

  useEffect(() => {
    let cancelled = false;

    async function analyzePayment() {
      setError("");
      setAnalysis(null);
      onAnalysisChange?.(null);

      if (!wallet || !wallet.startsWith("0x") || numericAmount <= 0) return;

      setLoading(true);

      try {
        const res = await fetch("/api/ai/analyze-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet,
            amount: numericAmount,
            balance,
            guardMode,
            minimumBalancePercent,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Payment review failed.");
        }

        if (!cancelled) {
          setAnalysis(data.analysis);
          onAnalysisChange?.(data.analysis);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to review payment risk."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(analyzePayment, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    wallet,
    numericAmount,
    balance,
    guardMode,
    minimumBalancePercent,
    onAnalysisChange,
  ]);

  const displayVerdict = analysis?.verdict ?? quickVerdict;

  const verdictLabel =
    displayVerdict === "safe"
      ? "Financially manageable"
      : displayVerdict === "risky"
        ? "Review before signing"
        : displayVerdict === "not_recommended"
          ? "Elevated risk detected"
          : "Awaiting payment details";

  const loadingLabel =
    quickVerdict === "safe"
      ? "Initial signal looks calm. Verifying cashflow..."
      : quickVerdict === "risky"
        ? "Possible pressure detected. Reviewing cashflow..."
        : quickVerdict === "not_recommended"
          ? "High payment pressure detected. Verifying..."
          : "Reviewing payment context...";

  const shellClass =
    displayVerdict === "safe"
      ? "border-emerald-100 bg-emerald-50"
      : displayVerdict === "risky"
        ? "border-amber-100 bg-amber-50"
        : displayVerdict === "not_recommended"
          ? "border-rose-100 bg-rose-50"
          : "border-indigo-100 bg-indigo-50";

  const verdictClass =
    displayVerdict === "safe"
      ? "text-emerald-600"
      : displayVerdict === "risky"
        ? "text-amber-600"
        : displayVerdict === "not_recommended"
          ? "text-rose-600"
          : "text-slate-500";

  const barClass =
    displayVerdict === "safe"
      ? "bg-emerald-500"
      : displayVerdict === "risky"
        ? "bg-amber-500"
        : displayVerdict === "not_recommended"
          ? "bg-rose-500"
          : "bg-slate-300";

  const estimateWidth =
    quickVerdict === "safe" ? 70 : quickVerdict === "risky" ? 45 : 25;

  return (
    <div className={`space-y-4 rounded-2xl border p-5 transition ${shellClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            Payment Intelligence
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            A transparent review of balance, cashflow, and payment pressure
            before wallet signing.
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
          Advisory only
        </span>
      </div>

      <div className="rounded-xl bg-white/80 p-4">
        <p className="text-sm text-slate-500">Payment under review</p>
        <p className="mt-1 text-2xl font-semibold text-slate-950">
          {numericAmount > 0 ? numericAmount.toFixed(2) : "0.00"} USDC
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Recipient {shortenAddress(recipient)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-white/80 p-3 text-slate-600">
          Balance checked
        </div>
        <div className="rounded-xl bg-white/80 p-3 text-slate-600">
          30d flow checked
        </div>
        <div className="rounded-xl bg-white/80 p-3 text-slate-600">
          User signs
        </div>
      </div>

      {guardMode && (
        <div className="rounded-xl bg-white/80 p-3 text-xs leading-5 text-slate-600">
          Spending Guard is active. Payments that may drop your wallet below the{" "}
          {minimumBalancePercent}% safety threshold will be flagged.
        </div>
      )}

      <div className="space-y-3 rounded-xl bg-white p-4">
        <p className="text-sm font-medium text-slate-600">Why this matters</p>

        <p className={`text-sm font-semibold ${verdictClass}`}>
          {loading ? loadingLabel : verdictLabel}
        </p>

        <p className="text-xs leading-5 text-slate-500">
          {error ||
            analysis?.reason ||
            (quickVerdict
              ? "PocketFlow is verifying this against your recent cashflow profile."
              : "Enter an amount to see whether this payment may create financial pressure.")}
        </p>

        {(analysis || quickVerdict) && (
          <>
            <div className="pt-2">
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all ${barClass}`}
                  style={{
                    width: `${analysis?.confidence ?? estimateWidth}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-right text-xs text-slate-500">
                {analysis
                  ? `Review confidence: ${analysis.confidence}%`
                  : "Live estimate"}
              </p>
            </div>

            {analysis && (
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Balance signal</p>
                  <p className="font-semibold capitalize text-slate-800">
                    {analysis.balanceSignal}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">30d net flow</p>
                  <p className="font-semibold text-slate-800">
                    {analysis.stats.netFlow30d.toFixed(2)} USDC
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Cashflow signal</p>
                  <p className="font-semibold capitalize text-slate-800">
                    {analysis.cashflowSignal}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Score pressure</p>
                  <p className="font-semibold capitalize text-slate-800">
                    {analysis.scoreImpact}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-center text-xs leading-5 text-slate-500">
        PocketFlow explains risk. It does not move funds. You approve manually,
        and your wallet remains the final authority.
      </p>
    </div>
  );
}