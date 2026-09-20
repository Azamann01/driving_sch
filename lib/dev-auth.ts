// Local development convenience: skips the dashboard login so you are not
// signing in every time you restart the dev server.
//
// Deliberately behind two independent gates. NODE_ENV is set to "production"
// by `next build`, `next start` and by Vercel, so the bypass cannot survive a
// deploy even if the env var were somehow set there. The explicit opt in on
// top of that means simply running `next dev` does not silently unlock the
// dashboard for anyone who clones the repo.
//
// If you ever find yourself wanting to loosen either gate, add real auth
// instead: the dashboard exposes every learner's name, email, phone and
// postcode.

export function isDevBypass() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}
