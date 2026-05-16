import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          PocketFlow
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          This page does not exist.
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          The financial view you’re looking for is unavailable or has moved.
        </p>

        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}