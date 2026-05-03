import BalanceCard from "@/components/BalanceCard";
import CashflowScoreCard from "@/components/CashflowScoreCard";
import RegistryProfileCard from "@/components/RegistryProfileCard";
import RecentActivity from "@/components/RecentActivity";
import AnalyticsSummary from "@/components/AnalyticsSummary";
import ActivityChart from "@/components/ActivityChart";
import WalletConnect from "@/components/WalletConnect";
import AutoIncomingSync from "@/components/AutoIncomingSync";
import AIAgentExplainerCard from "@/components/AIAgentExplainerCard";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const quickActions = [
  {
    href: "/send",
    title: "AI Send",
    description: "Send USDC with payment safety analysis.",
    featured: true,
  },
  {
    href: "/receive",
    title: "Receive",
    description: "Share your address and sync incoming funds.",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Control your proof-of-cashflow identity.",
  },
  {
    href: "/test-registry",
    title: "Visibility",
    description: "Change private, public, or shared profile mode.",
  },
  {
    href: "/score",
    title: "Score",
    description: "Understand your cashflow reputation.",
  },
];

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50 p-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <p className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              PocketFlow on Arc
            </p>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                A mini bank for stablecoin payments and proof-of-cashflow.
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Send and receive Arc testnet USDC, track real wallet activity,
                and build a user-controlled financial profile with AI payment
                review before signing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Auto incoming sync
              </span>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                AI payment review
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                Private / public / shared profile
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/send"
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Send with AI
              </Link>

              <Link
                href="/profile"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Manage Profile
              </Link>
            </div>
          </div>

          <div className="w-full max-w-lg">
            <WalletConnect />
          </div>
        </div>
      </Card>

      <AutoIncomingSync />

      <AIAgentExplainerCard />

      <section className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <BalanceCard />
        <CashflowScoreCard />
        <RegistryProfileCard />
      </section>

      <section className="grid items-start gap-6 pt-2 xl:grid-cols-2">
        <AnalyticsSummary />
        <ActivityChart />
      </section>

      <RecentActivity />

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Move money, review cashflow, and control your financial identity.
            </p>
          </div>

          <Link
            href="/send"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Start AI Send →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5S">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.featured
                  ? "rounded-2xl border border-indigo-100 bg-indigo-50 p-4 transition hover:bg-indigo-100"
                  : "rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-slate-50"
              }
            >
              <h3
                className={
                  action.featured
                    ? "text-lg font-semibold text-indigo-700"
                    : "text-lg font-semibold text-slate-950"
                }
              >
                {action.title}
              </h3>

              <p
                className={
                  action.featured
                    ? "mt-2 text-sm leading-6 text-indigo-600"
                    : "mt-2 text-sm leading-6 text-slate-500"
                }
              >
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}