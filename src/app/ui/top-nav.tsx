"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:focus-visible:outline-amber-400 ${
        isActive
          ? "bg-orange-500 text-white shadow-sm dark:bg-amber-400 dark:text-zinc-950 dark:shadow-none"
          : "text-orange-800 hover:bg-orange-50 dark:text-amber-200 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}

export default function TopNav() {
  return (
    <div className="no-print mb-6 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-600 dark:text-amber-300">
          Konge-bingo
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white/60 p-1 backdrop-blur dark:border-amber-500/20 dark:bg-white/5">
        <NavLink href="/">Online</NavLink>
        <NavLink href="/print">Print</NavLink>
      </div>
    </div>
  );
}
