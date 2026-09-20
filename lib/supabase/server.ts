// Server side Supabase client, used in server components, route handlers
// and server actions. Reads and writes the auth cookie so the dashboard's
// logged in session is respected by row level security.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isDevBypass } from "@/lib/dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createClient() {
  // With the local login bypass on there is no session, and every dashboard
  // query would be refused by row level security, so fall back to the service
  // role. See lib/dev-auth.ts for why this cannot reach production.
  if (isDevBypass()) {
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
