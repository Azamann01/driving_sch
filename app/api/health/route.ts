import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/dev-auth";

// Deployment diagnostics. Reports only booleans and Vercel's own build
// metadata, never a secret or a value, so it is safe to leave public.
//
// Exists because "the env var is set but nothing changed" is otherwise
// impossible to tell apart from "the build predates the env var" from
// outside the hosting dashboard.

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    demoMode: isDemoMode(),
    demoModeVarPresent: process.env.DEMO_MODE !== undefined,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    // Which of the variables the app needs are present. Values are never
    // included, only whether each one exists.
    configured: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      resend: Boolean(process.env.RESEND_API_KEY),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      twilio: Boolean(process.env.TWILIO_ACCOUNT_SID),
    },
  });
}
