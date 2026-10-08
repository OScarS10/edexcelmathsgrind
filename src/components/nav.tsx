"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Search, Target, TrendingUp, Zap } from "lucide-react";
import { AccountSwitcher } from "@/components/account-switcher";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/skills", label: "Skills", icon: Zap },
  { href: "/search", label: "Chapters", icon: Search },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/tmua", label: "TMUA", icon: Target },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-black text-white">
            π
          </span>
          <span className="hidden sm:inline">Edexcel A-Level Maths</span>
          <span className="sm:hidden">Edexcel Maths</span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <AccountSwitcher />
        </div>
      </nav>
    </header>
  );
}
