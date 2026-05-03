import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 55) return "text-indigo-600";
  if (score >= 30) return "text-amber-600";
  return "text-rose-600";
}

function visibilityLabel(value?: number) {
  if (value === 1) return "Public";
  if (value === 2) return "Shared";
  return "Private";
}

async function getRegistryProfile(wallet: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/registry-profile?wallet=${wallet}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.profile ?? null;
}

export default async function SharedProfilePage({ params }: PageProps) {
  const { id } = await params;

  const profile = await db.sharedProfile.findUnique({
    where: { shareId: id },
  });

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              PocketFlow Shared Profile
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Profile Not Found
            </h1>
            <p className="text-sm text-slate-600">
              This proof-of-cashflow profile does not exist or is no longer
              available.
            </p>
          </div>
        </Card>
      </main>
    );
  }

  const registryProfile = await getRegistryProfile(profile.wallet);
  const visibility = registryProfile?.visibility;
  const registryShareId = registryProfile?.sharedProfileId || "";

  const canShow =
    visibility === 1 ||
    (visibility === 2 && registryShareId === profile.shareId);

  if (!canShow) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              PocketFlow Shared Profile
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Profile Unavailable
            </h1>
            <p className="text-sm text-slate-600">
              This profile is currently private or no longer shared by the
              owner.
            </p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              PocketFlow Verified Profile
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Proof-of-Cashflow Snapshot
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              A shareable financial identity snapshot generated from real
              stablecoin payment activity and controlled by the wallet owner.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Visibility
            </p>
            <p className="mt-1 text-sm font-semibold text-indigo-700">
              {visibilityLabel(visibility)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
            <p className="text-sm text-slate-500">Cashflow Score</p>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={`text-7xl font-bold tracking-tight ${getScoreColor(
                    profile.score
                  )}`}
                >
                  {profile.score}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {profile.label} • {profile.trend}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Based on verified PocketFlow activity
                </p>
              </div>

              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Verified Snapshot
              </div>
            </div>

            <div className="mt-6 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-indigo-600"
                style={{ width: `${profile.score}%` }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">
              Profile Summary
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {profile.summary}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Wallet Identity</p>
              <p className="mt-2 break-all text-sm leading-6 text-slate-700">
                {profile.wallet}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Profile Label</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {profile.label}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Trend</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {profile.trend}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Last Updated</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {new Date(profile.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-indigo-100 bg-indigo-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Verified through PocketFlow
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This page reflects a wallet-controlled proof-of-cashflow snapshot.
              The owner can make it private, public, or shared at any time.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm font-semibold text-indigo-700">
            Arc Testnet
          </div>
        </div>
      </Card>
    </main>
  );
}