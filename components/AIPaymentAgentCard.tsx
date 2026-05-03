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

      if (!wallet || !wallet.startsWith("0x") || numericAmount <= 0) {
        return;
      }

      setLoading(true);

      try {
        const res = await fetch("/api/ai/analyze-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
          throw new Error(data.error || "Payment analysis failed.");
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
              : "Unable to analyze payment safety."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
      ? "Safe to pay"
      : displayVerdict === "risky"
        ? "Risky payment"
        : displayVerdict === "not_recommended"
          ? "Not recommended"
          : "Waiting for payment details";

  const loadingLabel =
    quickVerdict === "safe"
      ? "Looks safe… verifying"
      : quickVerdict === "risky"
        ? "Might be risky… checking"
        : quickVerdict === "not_recommended"
          ? "High risk… verifying"
          : "Analyzing payment...";

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

  const shellClass =
    displayVerdict === "safe"
      ? "border-emerald-100 bg-emerald-50"
      : displayVerdict === "risky"
        ? "border-amber-100 bg-amber-50"
        : displayVerdict === "not_recommended"
          ? "border-rose-100 bg-rose-50"
          : "border-indigo-100 bg-indigo-50";

  const headerClass =
    displayVerdict === "safe"
      ? "text-emerald-700"
      : displayVerdict === "risky"
        ? "text-amber-700"
        : displayVerdict === "not_recommended"
          ? "text-rose-700"
          : "text-indigo-700";

  const estimateWidth =
    quickVerdict === "safe" ? 70 : quickVerdict === "risky" ? 45 : 25;

  return (
    <div className={`space-y-4 rounded-2xl border p-5 transition ${shellClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${headerClass}`}>
            AI Payment Agent
          </h3>
          <p className="text-xs text-slate-500">
            Balance + cashflow check before signing.
          </p>
        </div>

        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-indigo-500">
          LIVE
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-slate-500">You’re about to send</p>
        <p className="text-2xl font-semibold text-slate-950">
          {numericAmount > 0 ? numericAmount.toFixed(2) : "0.00"} USDC
        </p>
        <p className="text-xs text-slate-500">To {shortenAddress(recipient)}</p>
      </div>

      {guardMode && (
        <div className="rounded-xl bg-white/80 p-3 text-xs text-slate-600">
          Spending Guard is watching your {minimumBalancePercent}% balance
          threshold.
        </div>
      )}

      <div className="space-y-3 rounded-xl bg-white p-4">
        <p className="text-sm font-medium text-slate-600">AI Analysis</p>

        <p className={`text-sm font-semibold ${verdictClass}`}>
          {loading ? loadingLabel : verdictLabel}
        </p>

        <p className="text-xs leading-5 text-slate-500">
          {error ||
            analysis?.reason ||
            (quickVerdict
              ? "PocketFlow is checking the full cashflow profile now."
              : "Enter an amount to let PocketFlow analyze payment safety.")}
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
                  ? `Confidence: ${analysis.confidence}%`
                  : "Live estimate"}
              </p>
            </div>

            {analysis && (
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Wallet balance</p>
                  <p className="font-semibold capitalize text-slate-800">
                    {analysis.balanceSignal}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Net flow 30d</p>
                  <p className="font-semibold text-slate-800">
                    {analysis.stats.netFlow30d.toFixed(2)} USDC
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Cashflow</p>
                  <p className="font-semibold capitalize text-slate-800">
                    {analysis.cashflowSignal}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-400">Score impact</p>
                  <p className="font-semibold capitalize text-slate-800">
                    {analysis.scoreImpact}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        You stay in control. AI only suggests. Wallet signs only after you
        approve.
      </p>
    </div>
  );
}