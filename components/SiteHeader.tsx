import Link from "next/link";
import { business } from "@/config/business";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {business.schoolName}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
          {/* py-2.5 is for thumbs, not looks: as bare text these were 20px
              tall, well under a comfortable tap target. */}
          <Link
            href="/#prices"
            className="py-2.5 text-zinc-600 hover:text-zinc-900"
          >
            Prices
          </Link>
          <Link
            href="/#coverage"
            className="py-2.5 text-zinc-600 hover:text-zinc-900"
          >
            Coverage
          </Link>
          <Link
            href="/book"
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
          >
            Book or enquire
          </Link>
          {/* Deliberately quiet: this is a staff door on a page whose job is
              converting learners, so it must not compete with the booking CTA. */}
          <span className="hidden h-4 w-px bg-zinc-200 sm:block" aria-hidden />
          <Link
            href="/dashboard"
            className="py-2.5 text-xs text-zinc-400 hover:text-zinc-700"
          >
            Owner login
          </Link>
        </nav>
      </div>
    </header>
  );
}
