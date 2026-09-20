// Two separate reasons the dashboard might open without a login.
//
// DEV_AUTH_BYPASS is a local convenience so you are not signing in every time
// the dev server restarts. It is gated on NODE_ENV as well, so it cannot
// survive a deploy.
//
// DEMO_MODE is the opposite: it is meant to work in production, so that
// someone you are pitching to can click into the dashboard and see the product
// without credentials. It leaves the dashboard open to anyone who finds the
// URL, so only turn it on where the data is fictional. The dashboard shows a
// banner whenever it is on, so a demo deployment can never be mistaken for a
// real one.

// Env vars are typed by hand into a dashboard, so tolerate the usual slips:
// stray whitespace, capitals, and the quotes people add out of habit.
function isTrue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "").toLowerCase() === "true";
}

export function isDevBypass() {
  return (
    process.env.NODE_ENV === "development" && isTrue(process.env.DEV_AUTH_BYPASS)
  );
}

export function isDemoMode() {
  return isTrue(process.env.DEMO_MODE);
}

export function isDashboardOpen() {
  return isDevBypass() || isDemoMode();
}
