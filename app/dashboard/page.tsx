import BalanceCard from "@/components/BalanceCard";
import CashflowScoreCard from "@/components/CashflowScoreCard";
import RegistryProfileCard from "@/components/RegistryProfileCard";
import RecentActivity from "@/components/RecentActivity";
import AnalyticsSummary from "@/components/AnalyticsSummary";
import ActivityChart from "@/components/ActivityChart";
import WalletConnect from "@/components/WalletConnect";
import AutoIncomingSync from "@/components/AutoIncomingSync";
import AIAgentExplainerCard from "@/components/AIAgentExplainerCard";
import FinancialStateCard from "@/components/FinancialStateCard";
import InsightFeed from "@/components/InsightFeed";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const quickActions = [
  {
    href: "/send",
    title: "Review Payment",
    description: "Understand payment pressure before signing.",
    featured: true,
  },
  {
    href: "/receive",
    title: "Receive",
    description: "Accept stablecoin inflow into your behavior history.",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Control how your cashflow identity is shared.",
  },
  {
    href: "/test-registry",
    title: "Privacy Controls",
    description: "Switch between private, public, and shared visibility.",
  },
  {
    href: "/score",
    title: "Behavior Signal",
    description: "See how PocketFlow reads your cashflow quality.",
  },
];

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <Card className="overflow-hidden border-indigo-100 bg-linear-to-br from-white via-indigo-50 to-slate-50 p-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                POCKETFLOW ON ARC
              </p>

              <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                Wallet-controlled
              </p>

              <p className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Advisory, not custodial
              </p>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                PocketFlow- Smart Banking With Cashflow Intelligence
                
              </h1>

              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                PocketFlow analyzes stablecoin activity, cashflow patterns, and 
                spending behavior so every payment is backed by 
                financial insight
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Monitor
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  Live cashflow activity
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Review
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  Payment review before signing
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Control
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  Private, public, or shared identity
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/send"
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Review a Payment
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

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <FinancialStateCard />
        <InsightFeed />
      </section>

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
              Operating Actions
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Move through PocketFlow by reviewing payments, receiving flow, and
              controlling your financial identity.
            </p>
          </div>

          <Link
            href="/send"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Review payment →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
}// deploy trigger Sat May 16 17:31:10 WAT 2026
