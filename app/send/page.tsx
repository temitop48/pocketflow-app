"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, isAddress, parseUnits } from "viem";
import WalletConnect from "@/components/WalletConnect";
import AIPaymentAgentCard, {
  type PaymentAnalysis,
} from "@/components/AIPaymentAgentCard";
import { Card, CardTitle } from "@/components/ui/Card";
import { erc20Abi, usdcToken } from "@/lib/tokens";

function verdictLabel(verdict?: PaymentAnalysis["verdict"]) {
  if (verdict === "safe") return "Safe";
  if (verdict === "risky") return "Risky";
  if (verdict === "not_recommended") return "Not recommended";
  return "Pending";
}

function verdictClass(verdict?: PaymentAnalysis["verdict"]) {
  if (verdict === "safe")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (verdict === "risky")
    return "bg-amber-50 text-amber-700 border-amber-100";
  if (verdict === "not_recommended")
    return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export default function SendPage() {
  const { address, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState("");
  const [status, setStatus] = useState("");
  const [paymentAnalysis, setPaymentAnalysis] =
    useState<PaymentAnalysis | null>(null);
  const [userApprovedAIReview, setUserApprovedAIReview] = useState(false);
  const [guardMode, setGuardMode] = useState(true);
  const [minimumBalancePercent, setMinimumBalancePercent] = useState(20);

  const savedConfirmedHashRef = useRef<string | null>(null);

  const pendingTransactionRef = useRef<{
    wallet: string;
    counterparty: string;
    amount: string;
    aiVerdict?: string;
    aiConfidence?: number;
    aiReason?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: usdcToken.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: mounted && address ? [address] : undefined,
    query: {
      enabled: mounted && !!address,
    },
  });

  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const parsedAmount = useMemo(() => {
    if (!amount.trim()) return null;

    try {
      return parseUnits(amount, usdcToken.decimals);
    } catch {
      return null;
    }
  }, [amount]);

  const numericBalance =
    balance !== undefined
      ? Number(formatUnits(balance, usdcToken.decimals))
      : undefined;

  const formattedBalance =
    mounted && numericBalance !== undefined
      ? numericBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })
      : "--";

  useEffect(() => {
    setUserApprovedAIReview(false);
  }, [recipient, amount, guardMode, minimumBalancePercent]);

  function handleMax() {
    if (balance === undefined) return;
    setAmount(formatUnits(balance, usdcToken.decimals));
  }

  function handleSend() {
    setLocalError("");
    setStatus("");

    if (!mounted || !isConnected || !address) {
      setLocalError("Connect wallet first.");
      return;
    }

    if (!recipient || !isAddress(recipient)) {
      setLocalError("Enter a valid recipient address.");
      return;
    }

    if (!parsedAmount || parsedAmount <= BigInt(0)) {
      setLocalError("Enter a valid USDC amount.");
      return;
    }

    if (balance !== undefined && parsedAmount > balance) {
      setLocalError("Amount exceeds your USDC balance.");
      return;
    }

    if (!paymentAnalysis) {
      setLocalError("Wait for the AI Payment Agent to analyze this payment.");
      return;
    }

    if (!userApprovedAIReview) {
      setLocalError("Review the AI Payment Agent result before signing.");
      return;
    }

    pendingTransactionRef.current = {
      wallet: address,
      counterparty: recipient,
      amount,
      aiVerdict: paymentAnalysis.verdict,
      aiConfidence: paymentAnalysis.confidence,
      aiReason: paymentAnalysis.reason,
    };

    setStatus("Waiting for wallet confirmation...");

    writeContract({
      address: usdcToken.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient as `0x${string}`, parsedAmount],
    });
  }

  useEffect(() => {
    async function handleConfirmed() {
      if (!isConfirmed || !hash) return;

      if (savedConfirmedHashRef.current === hash) return;

      savedConfirmedHashRef.current = hash;

      const snapshot = pendingTransactionRef.current;

      setStatus("Transfer confirmed successfully.");

      if (snapshot) {
        try {
          await fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              wallet: snapshot.wallet,
              counterparty: snapshot.counterparty,
              direction: "outgoing",
              amount: snapshot.amount,
              txHash: hash,
              status: "confirmed",
              aiVerdict: snapshot.aiVerdict,
              aiConfidence: snapshot.aiConfidence,
              aiReason: snapshot.aiReason,
            }),
          });

          window.dispatchEvent(new Event("pocketflow-activity-updated"));
        } catch (error) {
          console.error("Failed to save transaction activity:", error);
        }
      }

      pendingTransactionRef.current = null;

      refetchBalance();
      setAmount("");
      setRecipient("");
      setUserApprovedAIReview(false);
      setPaymentAnalysis(null);
    }

    handleConfirmed();
  }, [isConfirmed, hash, refetchBalance]);

  return (
    <main className="space-y-6">
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              PocketFlow AI Send
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Send with confidence
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Transfer Arc testnet USDC while the AI Payment Agent checks your
              balance, payment size, and cashflow safety before your wallet
              signs.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                AI suggestion only
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                User approves manually
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                Wallet signs payment
              </span>
            </div>
          </div>

          <div className="w-full max-w-md">
            <WalletConnect />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            title="Transfer Details"
            subtitle="Enter the recipient and amount for this payment."
          />

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Recipient Address
              </label>

              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">
                  Amount
                </label>

                <button
                  type="button"
                  onClick={handleMax}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Use Max
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-lg font-semibold outline-none"
                />

                <span className="text-sm font-medium text-indigo-600">
                  {usdcToken.symbol}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Available: {formattedBalance} {usdcToken.symbol}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-700">
                    Spending Guard
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Warn me if this payment drops my wallet below my safety
                    threshold.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setGuardMode((value) => !value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    guardMode
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {guardMode ? "On" : "Off"}
                </button>
              </div>

              {guardMode && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Safety threshold
                    </span>
                    <span className="text-xs font-semibold text-indigo-700">
                      {minimumBalancePercent}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={minimumBalancePercent}
                    onChange={(event) =>
                      setMinimumBalancePercent(Number(event.target.value))
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {paymentAnalysis && !userApprovedAIReview && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Review required before signing
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-700">
                  PocketFlow marked this payment as{" "}
                  <span className="font-semibold">
                    {verdictLabel(paymentAnalysis.verdict)}
                  </span>
                  . Confirm that you understand the AI suggestion before your
                  wallet signs.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setUserApprovedAIReview(true);
                    setLocalError("");
                  }}
                  className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  I understand, continue to review
                </button>
              </div>
            )}

            {paymentAnalysis && userApprovedAIReview && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Final Review Before Wallet Signing
                    </p>
                    <p className="text-xs text-slate-500">
                      This is the last step before your wallet confirms the
                      transaction.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      AI Verified
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${verdictClass(
                        paymentAnalysis.verdict
                      )}`}
                    >
                      {verdictLabel(paymentAnalysis.verdict)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Amount
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {amount || "0.00"} {usdcToken.symbol}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Confidence
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {paymentAnalysis.confidence}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Balance status
                    </p>
                    <p className="mt-1 font-semibold capitalize text-slate-800">
                      {paymentAnalysis.balanceSignal}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Cashflow status
                    </p>
                    <p className="mt-1 font-semibold capitalize text-slate-800">
                      {paymentAnalysis.cashflowSignal}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Recipient
                    </p>
                    <p className="mt-1 break-all font-medium text-slate-700">
                      {recipient}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={
                !mounted ||
                !isConnected ||
                isWriting ||
                isConfirming ||
                !paymentAnalysis ||
                !userApprovedAIReview
              }
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isWriting || isConfirming
                ? "Processing Transfer..."
                : userApprovedAIReview
                  ? "Approve and Send (Wallet will prompt)"
                  : "Review AI Analysis First"}
            </button>

            <p className="text-center text-xs text-slate-500">
              PocketFlow never moves funds automatically. Your wallet signs
              every transaction.
            </p>

            {status && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
                {status}
              </div>
            )}

            {localError && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                {localError}
              </div>
            )}

            {writeError && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                {writeError.message}
              </div>
            )}

            {hash && (
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Transaction Hash</p>
                <p className="mt-2 break-all text-sm">{hash}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              AI Payment Review
            </p>
          </div>

          <AIPaymentAgentCard
            wallet={mounted ? address : undefined}
            amount={amount}
            recipient={recipient}
            balance={mounted ? numericBalance : undefined}
            guardMode={guardMode}
            minimumBalancePercent={minimumBalancePercent}
            onAnalysisChange={setPaymentAnalysis}
          />

          <Card>
            <CardTitle
              title="Transfer Account"
              subtitle="Your connected wallet and available funds."
            />

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Available Balance</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {formattedBalance}
                </p>
                <p className="mt-1 text-lg font-medium text-indigo-600">
                  {usdcToken.symbol}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Wallet Address</p>
                <p
                  className="mt-2 break-all text-sm leading-6"
                  suppressHydrationWarning
                >
                  {mounted && address ? address : "Not connected"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Balance Status</p>
                <p className="mt-2 text-sm font-medium">
                  {!mounted
                    ? "Loading..."
                    : isBalanceLoading
                      ? "Loading..."
                      : "Ready"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}