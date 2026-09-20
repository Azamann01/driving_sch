// Browser side Supabase client, used from client components (e.g. the
// dashboard's interactive tables) where the user's own session cookie
// governs what they can read or write via row level security.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
