// Server only, and only for the Stripe webhook. The service role key
// bypasses row level security entirely, so this must never be imported
// from a client component or anywhere a user request could trigger it
// directly, only from trusted server to server callbacks like the
// webhook route, which authenticates the caller by verifying Stripe's
// signature instead of a user session.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
