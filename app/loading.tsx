export default function Loading() {
  return (
    <main className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="h-4 w-44 rounded-full bg-slate-100" />
        <div className="mt-5 h-10 w-full max-w-2xl rounded-2xl bg-slate-100" />
        <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-slate-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-56 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="h-4 w-36 rounded-full bg-slate-100" />
          <div className="mt-8 h-12 w-40 rounded-2xl bg-slate-100" />
        </div>

        <div className="h-56 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="h-4 w-36 rounded-full bg-slate-100" />
          <div className="mt-8 h-12 w-40 rounded-2xl bg-slate-100" />
        </div>

        <div className="h-56 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="h-4 w-36 rounded-full bg-slate-100" />
          <div className="mt-8 h-12 w-40 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}