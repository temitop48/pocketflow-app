"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi, usdcToken } from "@/lib/tokens";
import { Card, CardTitle } from "@/components/ui/Card";

export default function BalanceCard() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch, isRefetching } = useReadContract({
    address: usdcToken.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const formattedBalance =
    data !== undefined
      ? Number(formatUnits(data, usdcToken.decimals)).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          }
        )
      : "--";

  return (
    <Card className="h-full">
      <CardTitle
        title="Available Liquidity"
        subtitle="Stablecoin funds currently available for payments."
      />

      {!isConnected && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Connect wallet to view available liquidity.
        </div>
      )}

      {isConnected && isLoading && (
        <p className="mt-4 text-sm text-slate-500">Reading wallet balance...</p>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          Balance read failed: {error.message}
        </div>
      )}

      {isConnected && data !== undefined && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Spendable balance</p>

          <p className="mt-3 text-4xl font-semibold leading-none tracking-tight text-slate-950">
            {formattedBalance}
          </p>

          <p className="mt-2 text-lg font-medium text-indigo-600">
            {usdcToken.symbol}
          </p>

          <div className="mt-5 rounded-2xl bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Connected wallet
            </p>
            <p
              className="mt-2 break-all text-xs leading-5 text-slate-600"
              suppressHydrationWarning
            >
              {address}
            </p>
          </div>
        </div>
      )}

      {isConnected && (
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="mt-5 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isRefetching ? "Refreshing..." : "Refresh Liquidity"}
        </button>
      )}
    </Card>
  );
}