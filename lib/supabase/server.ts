// Server side Supabase client, used in server components, route handlers
// and server actions. Reads and writes the auth cookie so the dashboard's
// logged in session is respected by row level security.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isDashboardOpen } from "@/lib/dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createClient() {
  // With the login bypassed (local convenience, or demo mode) there is no
  // session, so row level security would refuse every dashboard query. Fall
  // back to the service role. The key stays server side either way, but note
  // demo mode does run in production: see lib/dev-auth.ts.
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
