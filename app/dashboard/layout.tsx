import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { business } from "@/config/business";
import { DashboardNav } from "@/components/DashboardNav";
import { isDashboardOpen } from "@/lib/access";
import { signOut } from "./actions";

// Keeps the owner's pages out of search results. They are behind a login, but
// the URLs should not be indexed or previewed either.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dashboardOpen = isDashboardOpen();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !dashboardOpen) {
    // Middleware already redirects to /dashboard/login for any other
    // dashboard route, this just lets the login page render without nav.
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {dashboardOpen && (
        <p className="bg-zinc-900 px-6 py-2 text-center text-sm text-white">
          <span className="font-medium">Demo.</span> Every learner, lesson and
          payment below is made up. Click anything you like.
        </p>
      )}
      <header className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{business.schoolName}</span>
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {/* py-3 makes this a 44px target; as bare text it was 20px. */}
            <Link
              href="/"
              className="py-3 text-zinc-500 hover:text-zinc-900"
            >
              View public site
            </Link>
            {/* No session to end while the dashboard is open, so signing out
                would do nothing but confuse whoever clicked it. */}
            {!dashboardOpen && (
              <>
                <span className="h-4 w-px bg-zinc-300" aria-hidden />
                <form action={signOut}>
                  <button className="py-3 text-zinc-500 hover:text-zinc-900">
                    Sign out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        <DashboardNav />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
