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
import { Card, CardTitle } from "@/components/ui/Card";
import {
  pocketFlowRegistryAbi,
  pocketFlowRegistryAddress,
} from "@/lib/contracts";

const visibilityLabels = ["Private", "Public", "Shared"] as const;

type ProfileState = {
  visibility: number;
  profileHash: string;
  sharedProfileId: string;
  updatedAt: number;
} | null;

type RegistryProfileReadResult = {
  visibility: number;
  profileHash: `0x${string}`;
  sharedProfileId: string;
  updatedAt: bigint;
};

function visibilityDescription(value: number) {
  if (value === 0) return "Your profile is hidden from public/shared views.";
  if (value === 1) return "Your profile can be viewed publicly.";
  if (value === 2) return "Only people with your share link can view it.";
  return "Unknown visibility mode.";
}

export default function TestRegistryPage() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();

  const [mounted, setMounted] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<0 | 1 | 2>(0);
  const [profile, setProfile] = useState<ProfileState>(null);
  const [readError, setReadError] = useState("");
  const [readStatus, setReadStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    setMounted(true);
  }, []);

  async function refreshProfile() {
    if (!address) {
      setReadError("Connect wallet first.");
      setReadStatus("");
      return;
    }

    if (!publicClient) {
      setReadError("Public client not ready yet.");
      setReadStatus("");
      return;
    }

    if (!pocketFlowRegistryAddress) {
      setReadError("Registry address is missing.");
      setReadStatus("");
      return;
    }

    try {
      setIsRefreshing(true);
      setReadError("");
      setReadStatus("Reading profile from Arc registry...");

      const data = (await publicClient.readContract({
        address: pocketFlowRegistryAddress,
        abi: pocketFlowRegistryAbi,
        functionName: "getProfile",
        args: [address],
      })) as RegistryProfileReadResult;

      const nextProfile = {
        visibility: Number(data.visibility),
        profileHash: String(data.profileHash),
        sharedProfileId: String(data.sharedProfileId),
        updatedAt: Number(data.updatedAt),
      };

      setProfile(nextProfile);

      if (
        nextProfile.visibility === 0 ||
        nextProfile.visibility === 1 ||
        nextProfile.visibility === 2
      ) {
        setSelectedVisibility(nextProfile.visibility as 0 | 1 | 2);
      }

      setReadStatus("Profile loaded successfully.");
    } catch (error) {
      setReadError(
        error instanceof Error ? error.message : "Failed to read profile."
      );
      setReadStatus("");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;

    if (isConnected && address) {
      refreshProfile();
    } else {
      setProfile(null);
      setReadError("");
      setReadStatus("");
    }
  }, [mounted, isConnected, address, publicClient]);

  useEffect(() => {
    if (mounted && isConfirmed) {
      refreshProfile();
    }
  }, [mounted, isConfirmed]);

  if (!mounted) {
    return (
      <main className="space-y-6">
        <Card>
          <p className="text-sm text-slate-500">PocketFlow Settings</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Profile Visibility
          </h1>
          <p className="mt-2 text-sm text-slate-600">Loading wallet...</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Card className="border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
              PocketFlow Settings
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Profile Visibility
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Control whether your proof-of-cashflow identity is private,
              public, or only available through a shared link.
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
            Connect wallet to manage profile visibility.
          </p>
        </Card>
      )}

      {isConnected && (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardTitle
                title="Visibility Control Panel"
                subtitle="Choose how your PocketFlow profile can be viewed."
              />

              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedVisibility(value as 0 | 1 | 2)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedVisibility === value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          selectedVisibility === value
                            ? "text-indigo-700"
                            : "text-slate-950"
                        }`}
                      >
                        {visibilityLabels[value as 0 | 1 | 2]}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {visibilityDescription(value)}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-sm text-slate-500">Selected Mode</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <VisibilityBadge value={selectedVisibility} />
                    <p className="text-sm text-slate-600">
                      {visibilityDescription(selectedVisibility)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isConnected || isWriting || isConfirming}
                  onClick={() =>
                    writeContract({
                      address: pocketFlowRegistryAddress,
                      abi: pocketFlowRegistryAbi,
                      functionName: "setVisibility",
                      args: [selectedVisibility],
                    })
                  }
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isWriting || isConfirming
                    ? "Updating Visibility..."
                    : "Save Visibility"}
                </button>

                {writeError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    {writeError.message}
                  </div>
                )}

                {hash && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Transaction Hash</p>
                    <p className="mt-2 break-all text-sm text-slate-700">
                      {hash}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle
                title="Current Registry State"
                subtitle="Latest onchain privacy data."
              />

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={refreshProfile}
                  disabled={isRefreshing}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh Registry"}
                </button>

                {readStatus && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {readStatus}
                  </div>
                )}

                {readError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    {readError}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Wallet</p>
                  <p className="mt-2 break-all text-sm leading-6">
                    {address}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Network</p>
                  <p className="mt-2 text-sm font-medium">
                    {chain?.name || "Unknown"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Current Mode</p>
                  <div className="mt-2">
                    <VisibilityBadge value={profile?.visibility ?? null} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Shared Profile ID</p>
                  <p className="mt-2 break-all text-sm leading-6">
                    {profile?.sharedProfileId || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Last Updated</p>
                  <p className="mt-2 text-sm leading-6">
                    {profile?.updatedAt
                      ? new Date(profile.updatedAt * 1000).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-indigo-100 bg-indigo-50">
            <h2 className="text-xl font-semibold text-slate-950">
              Privacy Test Checklist
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold">Private</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Shared profile should not be viewable.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold">Public</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Profile can be visible publicly.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold">Shared</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Only the active share link should work.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}