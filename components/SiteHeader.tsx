import Link from "next/link";
import { business } from "@/config/business";
import { isDashboardOpen } from "@/lib/access";

// One flex row on desktop. On phones it becomes two: the school name and the
// booking button on top, the quieter links underneath. Worth the trouble
// because the previous version wrapped to three rows and ate 165px, a fifth of
// a phone screen, before the page said anything.
//
// The source order is the desktop order, and `order` only rearranges below
// `sm`. That matters because CSS order moves things visually but not in the
// tab sequence, so reordering on desktop would have keyboard focus jumping
// around against what is on screen. Phones are touch first, so the mismatch
// costs nothing there.
//
// Vertical padding is sized for thumbs: these are 44px targets, not bare text.
export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 px-6 py-2 sm:gap-x-6 sm:py-3">
        <Link
          href="/"
          className="mr-auto py-2 text-lg font-semibold tracking-tight"
        >
          {business.schoolName}
        </Link>

        <Link
          href="/#prices"
          className="order-4 py-3 text-sm text-zinc-600 hover:text-zinc-900 sm:order-none"
        >
          Prices
        </Link>
        <Link
          href="/#coverage"
          className="order-5 py-3 text-sm text-zinc-600 hover:text-zinc-900 sm:order-none"
        >
          Coverage
        </Link>

        <Link
          href="/book"
          className="order-2 rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 sm:order-none"
        >
          Book or enquire
        </Link>

        {/* Zero height, full width: forces everything after it onto a second
            row on phones, and disappears once there is room for one line. */}
        <div className="order-3 w-full sm:hidden" aria-hidden />

        <span className="hidden h-4 w-px bg-zinc-200 sm:block" aria-hidden />
        {/* Deliberately quiet: a staff door on a page whose job is converting
            learners, so it must not compete with the booking button. */}
        <Link
          href="/dashboard"
          className="order-6 ml-auto py-3.5 text-xs text-zinc-400 hover:text-zinc-700 sm:order-none sm:ml-0"
        >
          {isDashboardOpen() ? "See the owner dashboard" : "Owner login"}
        </Link>
      </div>
    </header>
  );
}
