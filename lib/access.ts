// Whether the owner dashboard needs a login.
//
// This deployment is a showcase: the whole point is that someone being pitched
// to can click into the dashboard and see the product, so the dashboard is
// open by default and every page carries a demo banner.
//
// That means anything in the database is public. It is safe here because the
// data is entirely fictional (see scripts/seed-demo.mjs). Before this is ever
// used by a real school with real learners on it, set REQUIRE_LOGIN=true,
// which restores the email and password sign in.
//
// Deliberately inverted: the default takes no configuration, so a showcase
// cannot be broken by a missing variable, while switching the protection on
// is explicit and deliberate.

function isTrue(value: string | undefined) {
  // Env vars get typed by hand into hosting dashboards, so tolerate stray
  // whitespace, capitals and quotes rather than silently doing nothing.
  return value?.trim().replace(/^["']|["']$/g, "").toLowerCase() === "true";
}

export function requiresLogin() {
  return isTrue(process.env.REQUIRE_LOGIN);
}

export function isDashboardOpen() {
  return !requiresLogin();
}
