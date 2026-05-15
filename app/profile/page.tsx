"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import VisibilityBadge from "@/components/VisibilityBadge";
import {
  pocketFlowRegistryAbi,
  pocketFlowRegistryAddress,
} from "@/lib/contracts";
import { Card, CardTitle } from "@/components/ui/Card";

function subscribe() {
  return () => {};
}

type ScoreData = {
  score: number;
  label: string;
  trend: string;
  summary: string;
  breakdown: {
    transactionVolume: number;
    consistency: number;
    incomingStrength: number;
    cashflowBalance: number;
    recency: number;
  };
  stats: {
    incomingTotal: number;
    outgoingTotal: number;
    transactionCount: number;
    activeDays: number;
    incomingCount: number;
    outgoingCount: number;
    lastActivityAt: string | null;
  };
};

type SharedProfileResponse = {
  profile: {
    shareId: string;
    wallet: string;
    score: number;
    label: string;
    trend: string;
    summary: string;
    visibility: string;
  };
};

type RegistryProfileReadResult = {
  visibility: number;
  profileHash: `0x${string}`;
  sharedProfileId: string;
  updatedAt: bigint;
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 55) return "text-indigo-600";
  if (score >= 30) return "text-amber-600";
  return "text-rose-600";
}

export default function ProfilePage() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");

  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const [visibility, setVisibility] = useState<number | null>(null);
  const [registrySharedId, setRegistrySharedId] = useState("");

  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash });

  async function loadRegistryProfile() {
    if (!address || !publicClient || !pocketFlowRegistryAddress) return;

    const data = (await publicClient.readContract({
      address: pocketFlowRegistryAddress,
      abi: pocketFlowRegistryAbi,
      functionName: "getProfile",
      args: [address],
    })) as RegistryProfileReadResult;

    setVisibility(Number(data.visibility));
    setRegistrySharedId(String(data.sharedProfileId));
  }

  useEffect(() => {
    async function loadScore() {
      if (!address) return;

      try {
        setScoreLoading(true);
        setScoreError("");

        const res = await fetch(`/api/score?wallet=${address}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load identity signal.");
        }

        setScoreData(data);
      } catch (error) {
        setScoreError(
          error instanceof Error
            ? error.message
            : "Failed to load identity signal."
        );
      } finally {
        setScoreLoading(false);
      }
    }

    async function loadAll() {
      if (!isConnected || !address) return;

      await Promise.all([loadScore(), loadRegistryProfile()]);
    }

    if (mounted) {
      loadAll();
    }
  }, [address, isConnected, publicClient, mounted]);

  async function handleGenerateShareLink() {
    if (!address) {
      setShareError("Connect wallet first.");
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");
      setShareUrl("");

      const res = await fetch("/api/profile/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: address,
          visibility: "shared",
        }),
      });

      const data: SharedProfileResponse | { error: string } =
        await res.json();

      if (!res.ok || !("profile" in data)) {
        throw new Error(
          "error" in data ? data.error : "Failed to create identity link."
        );
      }

      const url = `${window.location.origin}/shared/${data.profile.shareId}`;
      setShareUrl(url);

      writeContract({
        address: pocketFlowRegistryAddress,
        abi: pocketFlowRegistryAbi,
        functionName: "setSharedProfileId",
        args: [data.profile.shareId],
      });

      setTimeout(() => {
        loadRegistryProfile().catch((error) => {
          console.error(
            "Failed to refresh registry profile:",
            error
          );
        });
      }, 2500);
    } catch (error) {
      setShareError(
        error instanceof Error
          ? error.message
          : "Failed to create identity link."
      );
    } finally {
      setShareLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <Card className="border-indigo-100 bg-linear-to-br from-white via-indigo-50 to-slate-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Financial Identity Control
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Control how your cashflow identity is shared.
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              PocketFlow turns verified stablecoin activity into a
              financial behavior signal. You decide whether that
              identity stays private, becomes public, or is shared
              through a controlled link.
            </p>
          </div>

          <div className="w-full max-w-md">
            <WalletConnect />
          </div>
        </div>
      </Card>

      {!mounted && (
        <Card>
          <p className="text-sm text-slate-500">
            Loading identity controls...
          </p>
        </Card>
      )}

      {mounted && !isConnected && (
        <Card>
          <p className="text-sm text-slate-600">
            Connect your wallet to view and manage your financial
            identity.
          </p>
        </Card>
      )}

      {mounted && isConnected && (
        <>
          <Card className="border-indigo-100 bg-indigo-50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-700">
                  Current Privacy State
                </p>

                <p className="text-xs leading-5 text-slate-600">
                  Your proof-of-cashflow identity can remain
                  private, become public, or be shared only by
                  link.
                </p>
              </div>

              <VisibilityBadge value={visibility} />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardTitle
                title="Identity Signal"
                subtitle="A strict financial behavior signal based on verified wallet activity."
              />

              {scoreLoading && (
                <p className="mt-5 text-sm text-slate-500">
                  Reading identity signal...
                </p>
              )}

              {scoreError && (
                <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  {scoreError}
                </div>
              )}

              {scoreData && (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Financial behavior score
                    </p>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p
                          className={`text-5xl font-bold ${getScoreColor(
                            scoreData.score
                          )}`}
                        >
                          {scoreData.score}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {scoreData.label} • {scoreData.trend}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Based on verified PocketFlow activity
                        </p>
                      </div>

                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium">
                        {scoreData.stats.transactionCount} records
                      </div>
                    </div>

                    <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-indigo-600"
                        style={{ width: `${scoreData.score}%` }}
                      />
                    </div>
                  </div>

                  <p className="rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600">
                    {scoreData.summary}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">
                        Incoming Flow
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.incomingTotal.toFixed(2)} USDC
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">
                        Outgoing Flow
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.outgoingTotal.toFixed(2)} USDC
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">
                        Active Days
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.activeDays}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">
                        Flow Mix
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.incomingCount} in /{" "}
                        {scoreData.stats.outgoingCount} out
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <CardTitle
                title="Wallet Identity"
                subtitle="Connected wallet and registry state."
              />

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Wallet</p>

                  <p className="mt-2 break-all text-sm leading-6">
                    {address}
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-sm text-slate-500">
                    Privacy Mode
                  </p>

                  <div className="mt-2">
                    <VisibilityBadge value={visibility} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">
                    Active Shared Identity ID
                  </p>

                  <p className="mt-2 break-all text-sm leading-6">
                    {registrySharedId || "Not set"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle
              title="Shareable Identity Link"
              subtitle="Create a controlled proof-of-cashflow link for others to view."
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    What this shares
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The link shows a financial identity snapshot:
                    score, label, trend, wallet, and summary.
                    You can revoke access by changing visibility
                    back to private.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateShareLink}
                  disabled={
                    shareLoading || isWriting || isConfirming
                  }
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {shareLoading || isWriting || isConfirming
                    ? "Creating Identity Link..."
                    : "Create Identity Link"}
                </button>

                {shareError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    {shareError}
                  </div>
                )}

                {writeError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    Registry update failed: {writeError.message}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {shareUrl ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">
                      Your controlled identity link is ready.
                    </p>

                    <p className="mt-3 break-all text-sm text-emerald-800">
                      {shareUrl}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Anyone with this link can view the current
                      shared identity snapshot while your visibility
                      allows it.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Open Shared Identity
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Identity Link
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      No controlled identity link has been created
                      yet.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">
                    Registry Sync
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {isWriting || isConfirming
                      ? "Updating shared identity onchain..."
                      : hash
                        ? "Latest shared identity update was submitted."
                        : "No recent registry update."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}