"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg rounded-3xl border border-rose-100 bg-rose-50 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
          PocketFlow System Notice
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Something interrupted this view.
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          The app is still running, but this screen could not finish loading.
          You can retry safely.
        </p>

        <p className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-500">
          {error.message || "Unknown error"}
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}