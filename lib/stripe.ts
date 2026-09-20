// Server only. Never import this from a client component, the secret key
// must never reach the browser.
//
// Constructed lazily (not at module load) because Stripe's SDK throws
// immediately if the key is missing, and Next.js evaluates route modules
// at build time to collect page data, which would break `next build` for
// anyone who hasn't set STRIPE_SECRET_KEY yet.

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}
