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

export function DashboardNav({
  counts = {},
}: {
  counts?: Record<string, number>;
}) {
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
            className={`whitespace-nowrap border-b-2 px-2 py-3 transition-colors sm:px-3 ${
              active
                ? "border-zinc-900 font-medium text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
            }`}
          >
            <span className="sm:hidden">{item.short}</span>
            <span className="hidden sm:inline">{item.label}</span>
            {/* Zero is left off deliberately: a "0" badge is noise, and its
                absence already says there is nothing to do. */}
            {counts[item.href] > 0 && (
              // A pill costs about 25px per tab, which is what pushed all four
              // back over a 375px screen. On phones the number carries on its
              // own; the pill returns once there is room for it.
              <span
                className={`ml-1 text-xs font-medium tabular-nums sm:ml-1.5 sm:rounded-full sm:px-1.5 sm:py-0.5 sm:font-normal ${
                  active
                    ? "text-zinc-900 sm:bg-zinc-900 sm:text-white"
                    : "text-zinc-500 sm:bg-zinc-200 sm:text-zinc-700"
                }`}
              >
                {counts[item.href]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
