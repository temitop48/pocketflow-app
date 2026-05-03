"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import {
  pocketFlowRegistryAbi,
  pocketFlowRegistryAddress,
} from "@/lib/contracts";
import VisibilityBadge from "@/components/VisibilityBadge";
import { Card, CardTitle } from "@/components/ui/Card";

type RegistryProfile = {
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

function visibilityText(value?: number) {
  if (value === 0) return "Private";
  if (value === 1) return "Public";
  if (value === 2) return "Shared";
  return "Not set";
}

function visibilityDescription(value?: number) {
  if (value === 0) return "Your cashflow profile is hidden by default.";
  if (value === 1) return "Your profile can be viewed publicly.";
  if (value === 2) return "Only people with your shared link can view it.";
  return "Connect and register your wallet to activate profile controls.";
}

export default function RegistryProfileCard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<RegistryProfile>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function refreshProfile() {
    if (!mounted || !address || !publicClient || !pocketFlowRegistryAddress) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = (await publicClient.readContract({
        address: pocketFlowRegistryAddress,
        abi: pocketFlowRegistryAbi,
        functionName: "getProfile",
        args: [address],
      })) as RegistryProfileReadResult;

      setProfile({
        visibility: Number(data.visibility),
        profileHash: String(data.profileHash),
        sharedProfileId: String(data.sharedProfileId),
        updatedAt: Number(data.updatedAt),
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load registry profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;

    if (isConnected && address) {
      refreshProfile();
    } else {
      setProfile(null);
      setError("");
    }
  }, [mounted, isConnected, address, publicClient]);

  if (!mounted) {
    return (
      <Card className="h-full">
        <CardTitle
          title="Profile Privacy"
          subtitle="Loading onchain visibility state."
        />
        <p className="mt-4 text-sm text-slate-500">Loading profile status...</p>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <CardTitle
          title="Profile Privacy"
          subtitle="Control who can see your proof-of-cashflow."
        />

        <button
          type="button"
          onClick={refreshProfile}
          className="shrink-0 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {!isConnected && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Connect wallet to view onchain profile privacy.
        </div>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">Loading registry profile...</p>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {profile && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm text-slate-500">Current Privacy Mode</p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <VisibilityBadge value={profile.visibility} />
              <span className="text-sm font-semibold text-slate-900">
                {visibilityText(profile.visibility)}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {visibilityDescription(profile.visibility)}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Shared Profile ID</p>
              <p className="mt-2 break-all text-sm leading-6 text-slate-700">
                {profile.sharedProfileId || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Last Onchain Update</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {profile.updatedAt
                  ? new Date(profile.updatedAt * 1000).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}