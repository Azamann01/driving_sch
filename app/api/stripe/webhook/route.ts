import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe calls this directly, there is no user session, so signature
// verification (not an auth cookie) is what proves a request is genuine.
// The service role client is used deliberately here, see
// lib/supabase/admin.ts for why that is safe in this one spot.

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      const supabase = createAdminClient();

      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", bookingId);

      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "paid" })
        .eq("provider_reference", session.id);

      if (bookingError || paymentError) {
        // Returning 500 makes Stripe retry, which is what we want: the
        // payment succeeded, so leaving the booking marked unpaid is worse
        // than a duplicate update (both are idempotent).
        console.error("Failed to record payment", {
          bookingId,
          bookingError,
          paymentError,
        });
        return NextResponse.json(
          { error: "Could not record the payment." },
          { status: 500 }
        );
      }

      // The dashboard reads these pages per request, but Next.js can still
      // serve a client cached render, so a payment would not show until a
      // hard refresh without this.
      revalidatePath("/dashboard/payments");
      revalidatePath("/dashboard/lessons");
    }
  }

  return NextResponse.json({ received: true });
}
