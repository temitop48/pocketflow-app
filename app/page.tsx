"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 space-y-12">
      <section className="space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            PocketFlow Mini Bank
          </p>

          <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl leading-[1.05]">
            Your financial flow,
            <br />
            <span className="text-indigo-600">organized and visible.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600">
            Manage stablecoin payments, track activity automatically, and build a
            shareable proof-of-cashflow identity on Arc.
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Open Dashboard
          </Link>

          <Link
            href="/profile"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium transition hover:bg-slate-100"
          >
            View Profile
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="text-lg font-semibold">Global Pocket Bank</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Send, receive, and manage Arc testnet USDC in a calm, simple
            banking-style interface.
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Auto Activity Tracking</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Incoming payments can be detected automatically and added to your
            PocketFlow activity stream.
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Proof-of-Cashflow</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Turn transaction history into a score, trend, and shareable
            financial identity.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Sample Cashflow Score</p>
              <p className="mt-2 text-5xl font-semibold text-indigo-600">74</p>
              <p className="mt-1 text-sm text-slate-500">Strong • Stable</p>

              <div className="mt-5 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{ width: "74%" }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Incoming</p>
                <p className="mt-2 text-2xl font-semibold">148.00 USDC</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Outgoing</p>
                <p className="mt-2 text-2xl font-semibold">91.25 USDC</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Why PocketFlow
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Most wallets stop at balances and transfers. PocketFlow adds a
                financial identity layer on top, so users can manage money and
                control how their payment credibility is presented.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Built for Arc</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  Stablecoin-native payment and identity experience
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">User-controlled</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  Private, public, or shared profile visibility
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Start using PocketFlow
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Explore the dashboard, move funds, and generate your
              proof-of-cashflow profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/receive"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-slate-100"
            >
              Receive Payment
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}