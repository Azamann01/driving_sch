// Server side Supabase client, used in server components, route handlers
// and server actions. Reads and writes the auth cookie so the dashboard's
// logged in session is respected by row level security.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isDashboardOpen } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createClient() {
  // With the dashboard open there is no session, so row level security would
  // refuse every query. Fall back to the service role, which stays server
  // side. See lib/access.ts: this applies in production by design.
  if (isDashboardOpen()) {
    return createAdminClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies.
            // Safe to ignore when middleware is refreshing the session.
          }
        },
      },
    }
  );
}
