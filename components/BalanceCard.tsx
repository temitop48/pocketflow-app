"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi, usdcToken } from "@/lib/tokens";
import { Card, CardTitle } from "@/components/ui/Card";

export default function BalanceCard() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error, refetch, isRefetching } = useReadContract({
    address: usdcToken.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: mounted && !!address,
    },
  });

  if (!mounted) {
    return (
      <Card className="h-full">
        <CardTitle
          title="Account Balance"
          subtitle="Available Arc testnet USDC in your connected wallet."
        />
        <p className="mt-4 text-sm text-slate-500">Loading balance...</p>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardTitle
        title="Account Balance"
        subtitle="Available Arc testnet USDC in your connected wallet."
      />

      {!isConnected && <p className="mt-4 text-sm">Connect wallet first.</p>}

      {isConnected && isLoading && (
        <p className="mt-4 text-sm">Loading balance...</p>
      )}

      {error && (
        <p className="mt-4 break-words text-sm text-rose-600">
          Balance error: {error.message}
        </p>
      )}

      {isConnected && data !== undefined && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Available balance</p>

          <p className="mt-3 text-4xl font-semibold leading-none tracking-tight">
            {Number(formatUnits(data, usdcToken.decimals)).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }
            )}
          </p>

          <p className="mt-2 text-lg font-medium text-indigo-600">
            {usdcToken.symbol}
          </p>

          <p className="mt-4 break-all text-xs leading-5 text-slate-500">
            Wallet: {address}
          </p>
        </div>
      )}

      {isConnected && (
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="mt-5 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isRefetching ? "Refreshing..." : "Refresh Balance"}
        </button>
      )}
    </Card>
  );
}