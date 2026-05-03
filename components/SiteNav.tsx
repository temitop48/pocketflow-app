import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/send", label: "Send" },
  { href: "/receive", label: "Receive" },
  { href: "/profile", label: "Profile" },
];

export default function SiteNav() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-lg font-bold">
          PocketFlow
        </Link>

        <div className="flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 transition hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}