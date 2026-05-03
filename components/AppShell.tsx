"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/send", label: "Send" },
  { href: "/receive", label: "Receive" },
  { href: "/profile", label: "Profile" },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-r border-slate-200 bg-white lg:w-64 lg:min-h-screen">
        <div className="flex h-full flex-col px-5 py-6">
          <div className="mb-8">
            <Link href="/" className="block">
              <p className="text-2xl font-bold tracking-tight">PocketFlow</p>
              <p className="text-sm text-indigo-500">Mini Bank</p>
            </Link>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-8">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Network</p>
              <p className="mt-1 font-medium">Arc Testnet</p>
            </div>

            <p className="text-xs text-slate-400">© 2026 PocketFlow</p>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}