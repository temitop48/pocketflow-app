"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import AutoIncomingSync from "@/components/AutoIncomingSync";
import { Card, CardTitle } from "@/components/ui/Card";

function subscribe() {
  return () => {};
}

export default function ReceivePage() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const { address, isConnected, chain } = useAccount();
  const [copied, setCopied] = useState(false);

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
      <Card className="border-indigo-100 bg-linear-to-br from-white via-indigo-50 to-slate-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Cashflow Intake
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Receive funds and strengthen your financial signal.
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Incoming stablecoin payments become part of your PocketFlow
              behavior history, helping the system understand your cashflow
              quality over time.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Incoming flow tracked
              </span>
              <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-medium text-indigo-700">
                Sender context captured
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                Behavior signal improves with activity
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
            title="Receive Into PocketFlow"
            subtitle="Use this address to collect stablecoin flow into your financial history."
          />

          {!ready && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Connect your wallet to reveal your receive address.
            </div>
          )}

          {ready && (
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">
                  Active receive wallet
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
                  {copied ? "Address Copied" : "Copy Receive Address"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    1. Share address
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Use this wallet for incoming stablecoin payments.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    2. Receive flow
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    PocketFlow records incoming activity once detected.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    3. Build signal
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    More verified activity strengthens your behavior profile.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-700">
                Keep PocketFlow open while testing. The monitor reads incoming
                transfers and adds them to your financial timeline.
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle
            title="Receiving Context"
            subtitle="Wallet, network, and asset used for incoming flow."
          />

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Wallet</p>
              <p className="mt-2 text-lg font-semibold">
                {ready ? shortAddress : "Not connected"}
              </p>
              {ready && (
                <p className="mt-2 break-all text-xs leading-5 text-slate-500">
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
              <p className="text-sm text-slate-500">Tracked Asset</p>
              <p className="mt-2 text-sm font-medium">Arc Testnet USDC</p>
            </div>
          </div>
        </Card>
      </div>

      {mounted && (
        <Card>
          <CardTitle
            title="Incoming Flow Monitor"
            subtitle="PocketFlow watches for incoming transfers and records them as financial behavior."
          />

          <div className="mt-6 space-y-4">
            <AutoIncomingSync />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Why this matters
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Incoming payments are not just balance changes. They become part
                of your proof-of-cashflow identity and help PocketFlow understand
                the strength of your financial activity.
              </p>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}