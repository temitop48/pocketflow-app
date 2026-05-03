"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import AutoIncomingSync from "@/components/AutoIncomingSync";
import { Card, CardTitle } from "@/components/ui/Card";

export default function ReceivePage() {
  const { address, isConnected, chain } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ CRITICAL: prevents hydration mismatch
  const ready = mounted && isConnected && !!address;

  const shortAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  async function handleCopy() {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <Card className="border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
              PocketFlow Mini Bank
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Receive stablecoin payments
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Share your Arc wallet address, receive testnet USDC, and let
              PocketFlow automatically turn incoming payments into verified
              cashflow activity.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Auto incoming sync
              </span>
              <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-medium text-indigo-700">
                Real sender captured
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                Score updates from activity
              </span>
            </div>
          </div>

          <div className="w-full max-w-md">
            <WalletConnect />
          </div>
        </div>
      </Card>

      {/* MAIN GRID */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* RECEIVE ADDRESS */}
        <Card className="xl:col-span-2">
          <CardTitle
            title="Your Receive Address"
            subtitle="Use this wallet to receive Arc testnet USDC."
          />

          {!ready && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Connect your wallet to view and copy your receive address.
            </div>
          )}

          {ready && (
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">
                  Connected receive wallet
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {shortAddress}
                </p>

                <p className="mt-3 break-all rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
                  {address}
                </p>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-4 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  {copied ? "Address Copied" : "Copy Address"}
                </button>
              </div>

              {/* FLOW STEPS */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    1. Share address
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Send this wallet to anyone paying you.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    2. Receive USDC
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Incoming transfers land in your wallet.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    3. Build profile
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    PocketFlow records activity for your score.
                  </p>
                </div>
              </div>

              {/* INFO */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                Keep PocketFlow open while testing auto-sync so incoming
                payments are detected and recorded instantly.
              </div>
            </div>
          )}
        </Card>

        {/* SIDE PANEL */}
        <Card>
          <CardTitle
            title="Receiving Account"
            subtitle="Wallet, network, and supported asset."
          />

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Connected Wallet</p>
              <p className="mt-2 text-lg font-semibold">
                {ready ? shortAddress : "Not connected"}
              </p>
              {ready && (
                <p className="mt-2 break-all text-xs text-slate-500">
                  {address}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Network</p>
              <p className="mt-2 text-sm font-medium">
                {mounted && chain?.name ? chain.name : "Unknown"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Supported Asset</p>
              <p className="mt-2 text-sm font-medium">
                Arc Testnet USDC
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* AUTO SYNC */}
      {mounted && (
        <Card>
          <CardTitle
            title="Incoming Payment Monitoring"
            subtitle="PocketFlow scans for incoming transfers automatically."
          />

          <div className="mt-6 space-y-4">
            <AutoIncomingSync />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Why this matters
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Every incoming payment strengthens your financial identity and
                improves your proof-of-cashflow score.
              </p>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}