"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import VisibilityBadge from "@/components/VisibilityBadge";
import { pocketFlowRegistryAbi, pocketFlowRegistryAddress } from "@/lib/contracts";
import { Card, CardTitle } from "@/components/ui/Card";

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
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [mounted, setMounted] = useState(false);

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

  const { isSuccess: isConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    setMounted(true);
  }, []);

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
          throw new Error(data.error || "Failed to load score.");
        }

        setScoreData(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load score.";
        setScoreError(message);
      } finally {
        setScoreLoading(false);
      }
    }

    async function loadAll() {
      if (!isConnected || !address) {
        setScoreData(null);
        setScoreError("");
        setShareUrl("");
        setVisibility(null);
        setRegistrySharedId("");
        return;
      }

      await Promise.all([loadScore(), loadRegistryProfile()]);
    }

    if (mounted) {
      loadAll();
    }
  }, [address, isConnected, publicClient, mounted]);

  useEffect(() => {
    if (isConfirmed) {
      loadRegistryProfile().catch((error) => {
        console.error("Failed to refresh registry profile:", error);
      });
    }
  }, [isConfirmed]);

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

      const data: SharedProfileResponse | { error: string } = await res.json();

      if (!res.ok || !("profile" in data)) {
        throw new Error(
          "error" in data ? data.error : "Failed to create share link."
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create share link.";
      setShareError(message);
    } finally {
      setShareLoading(false);
    }
  }

  if (!mounted) {
    return (
      <main className="space-y-6">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">PocketFlow Mini Bank</p>
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <p className="text-sm text-slate-600">
              Manage your proof-of-cashflow identity and sharing settings.
            </p>
          </div>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Loading profile...</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">PocketFlow Mini Bank</p>
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Manage your proof-of-cashflow identity, visibility mode, and
              shareable profile links.
            </p>
          </div>

          <div className="w-full max-w-md">
            <WalletConnect />
          </div>
        </div>
      </Card>

      {!isConnected && (
        <Card>
          <p className="text-sm text-slate-600">
            Connect your wallet to view and manage your PocketFlow profile.
          </p>
        </Card>
      )}

      {isConnected && (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardTitle
                title="Identity Snapshot"
                subtitle="Your current cashflow signal and profile performance."
              />

              {scoreLoading && <p className="mt-5 text-sm">Loading score...</p>}
              {scoreError && (
                <p className="mt-5 text-sm text-rose-600">{scoreError}</p>
              )}

              {scoreData && (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Current score</p>
                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className={`text-5xl font-bold ${getScoreColor(scoreData.score)}`}>
                          {scoreData.score}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {scoreData.label} • {scoreData.trend}
                        </p>
                      </div>

                      <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium">
                        {scoreData.stats.transactionCount} transactions
                      </div>
                    </div>

                    <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-indigo-600"
                        style={{ width: `${scoreData.score}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    {scoreData.summary}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Incoming Total</p>
                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.incomingTotal.toFixed(2)} USDC
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Outgoing Total</p>
                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.outgoingTotal.toFixed(2)} USDC
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Active Days</p>
                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.activeDays}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Activity Mix</p>
                      <p className="mt-2 text-xl font-semibold">
                        {scoreData.stats.incomingCount} in / {scoreData.stats.outgoingCount} out
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <CardTitle
                title="Wallet Identity"
                subtitle="Your connected wallet and latest profile state."
              />

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Wallet</p>
                  <p className="mt-2 break-all text-sm leading-6">
                    {address}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Visibility Mode</p>
                  <div className="mt-2">
                    <VisibilityBadge value={visibility} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Onchain Shared Profile ID</p>
                  <p className="mt-2 break-all text-sm leading-6">
                    {registrySharedId || "Not set"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle
              title="Sharing Controls"
              subtitle="Create a shareable proof-of-cashflow link and sync it with your onchain profile."
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Current Share State</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Generate a share link to create a public proof page for your
                    current financial identity snapshot.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateShareLink}
                  disabled={shareLoading || isWriting || isConfirming}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {shareLoading || isWriting || isConfirming
                    ? "Generating Share Link..."
                    : "Generate Share Link"}
                </button>

                {shareError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    {shareError}
                  </div>
                )}

                {writeError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    Onchain update error: {writeError.message}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {shareUrl ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">
                      Share link created successfully.
                    </p>
                    <p className="mt-3 break-all text-sm text-emerald-800">
                      {shareUrl}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Open Shared Profile
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Share Link</p>
                    <p className="mt-2 text-sm text-slate-600">
                      No share link generated yet.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Onchain Sync Status</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {isWriting || isConfirming
                      ? "Updating registry onchain..."
                      : hash
                      ? "Latest share ID update submitted."
                      : "No recent onchain share update."}
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