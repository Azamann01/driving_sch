"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Short labels on phones so all four tabs fit at 375px. The full labels needed
// 571px in a 375px window, which quietly hid Outstanding payments and Waiting
// list behind a horizontal scroll nobody would think to try.
const navItems = [
  { href: "/dashboard/enquiries", label: "New enquiries", short: "Enquiries" },
  { href: "/dashboard/lessons", label: "Confirmed lessons", short: "Lessons" },
  { href: "/dashboard/payments", label: "Outstanding payments", short: "Payments" },
  { href: "/dashboard/waiting-list", label: "Waiting list", short: "Waiting" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Belt and braces for narrow screens: if the active tab is off screen, the
  // page looks like it has no tab selected at all.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm">
      {navItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            ref={active ? activeRef : undefined}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-3 transition-colors ${
              active
                ? "border-zinc-900 font-medium text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
            }`}
          >
            <span className="sm:hidden">{item.short}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
