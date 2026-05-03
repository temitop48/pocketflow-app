import Link from "next/link";

export default function AIAgentExplainerCard() {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            AI Payment Agent
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Smarter payments before you sign
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            PocketFlow checks wallet balance, recent cashflow, and payment risk,
            then gives a safety suggestion. You still approve manually, and your
            wallet signs the transaction.
          </p>
        </div>

        <Link
          href="/send"
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Try AI Send
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">1. AI analyzes</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Balance, amount, and 30-day cashflow are reviewed.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">2. You approve</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            The app shows a verdict before wallet confirmation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">3. Wallet signs</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            No automatic payments. Your wallet remains the final authority.
          </p>
        </div>
      </div>
    </div>
  );
}