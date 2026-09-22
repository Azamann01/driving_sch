# Driving school booking platform

Three screens: a public page, a booking screen, and an owner dashboard. See
`driving_school_platform_plan.md` for the full reasoning behind the scope
and technology choices, this file is just the practical setup steps.

**Currently running as a showcase, not a live business system.** It is
deployed at https://drivingsch-eta.vercel.app with the dashboard open to
anyone (no login) and entirely fictional data, so it can be shown to
prospective clients in one click. See "Running it as a demo" for how that
works and how to switch it back to a protected system.

Quickest way to check what a deployment actually has:
`https://your-url/api/health` reports the commit it is running, whether the
dashboard is open, and which environment variables reached it. Booleans and
build metadata only, never a secret.

## 1. Edit your business details

Open `config/business.ts` and fill in your school name, contact details,
base postcode, coverage radius, and lesson types and prices. This is the
only file you need to touch to make the public site and booking form
reflect your real school.

## 2. Connect your Supabase project

You said you already have a Supabase project, so:

1. In the Supabase dashboard, go to Project Settings, then API, and copy
   the Project URL and the anon public key.
2. Copy `.env.local.example` to `.env.local` and paste those two values in.
3. In the Supabase dashboard, go to the SQL Editor and run the migrations in
   `supabase/migrations/` in order:
   - `0001_init.sql` creates every table (instructors, students, enquiries,
     bookings, payments, waiting list) and the row level security policies
     that keep the public site able to submit enquiries but not read anyone
     else's data.
   - `0002_reminders.sql` adds `reminder_sent_at` to bookings, which the
     lessons page uses to show when a reminder last went out.

   If a column still reads as missing after running a migration, PostgREST
   is caching the old schema: run `notify pgrst, 'reload schema';`. Check
   the project ref in the SQL editor's URL matches the one in your
   `NEXT_PUBLIC_SUPABASE_URL` before assuming that, though: running a
   migration against a second project looks identical from the outside.
4. Only if you are setting `REQUIRE_LOGIN=true`: go to Authentication, then
   Users, and add yourself with an email and password. There is no public
   signup form by design, since this is a single owner operated dashboard,
   not a multi user product. Skip this while the dashboard is open.
5. Go to the Table Editor, open the instructors table, and add at least
   one row (name, email, phone) so you have someone to assign lessons to
   from the dashboard. There is deliberately no instructor management
   screen in version one, add and edit instructors directly here for now.
   `scripts/seed-demo.mjs` creates instructors for you if you are running
   this as a demo.

## 3. Run it locally

```
npm install
npm run dev
```

Visit `http://localhost:3000` for the public page, `/book` for the booking
form, and `/dashboard` for the owner dashboard, which opens straight up
unless you have set `REQUIRE_LOGIN=true`.

## 4. Deploy

Deploy to a staging URL first and keep it there until everything in
"Before you take real customers" below is done. Staging runs against the
same Supabase project and the same Stripe sandbox, so it is safe to click
around, but it must not be handed to learners yet.

### 4a. Push the code

Already done for this project: it lives at
https://github.com/Azamann01/driving_sch and Vercel rebuilds on every push
to `main`. Starting fresh elsewhere, it is `git init`, a commit, an empty
GitHub repository, and a push.

Note that `git status` showing "up to date" is not proof a push reached
GitHub; the remote tracking ref is local bookkeeping and can get ahead of
reality. The output of `git push` is the reliable signal.

### 4b. Create the Vercel project

1. In Vercel, import the repository as a new project.
2. Add the environment variables below under Project Settings, then
   Environment Variables, before the first deploy. The build succeeds
   without them, but the dashboard and the payment and email features
   will fail at runtime.
3. Deploy. Vercel gives you a URL like `your-project.vercel.app`, which
   is your staging address.
4. Come back and set `NEXT_PUBLIC_SITE_URL` to that exact URL, then
   redeploy. Stripe reads it to decide where to send a customer after
   checkout, so while it still says `localhost` it will send them to
   their own machine.

### 4c. Environment variables

| Variable | Where it comes from | If it is missing |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings > API | Every dashboard page returns a 500 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase, same page, the `anon` key | Same, a 500 on the dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase, same page, the `service_role` key | Stripe webhooks stop marking bookings paid |
| `STRIPE_SECRET_KEY` | Stripe, Developers > API keys | Generating a payment link errors |
| `STRIPE_WEBHOOK_SECRET` | Stripe, Developers > Webhooks, after adding the endpoint in 4d | Webhooks are rejected as unsigned |
| `RESEND_API_KEY` | Resend, API Keys | Emails are skipped, with a warning in the log. Enquiries and bookings still save |
| `EMAIL_FROM` | An address on your verified Resend domain | Falls back to `onboarding@resend.dev`, which can only email your own account |
| `NEXT_PUBLIC_SITE_URL` | The deployed URL from step 4b | Stripe sends paying customers back to `localhost` |
| `TWILIO_ACCOUNT_SID` | Twilio console | Reminder texts refuse to send |
| `TWILIO_AUTH_TOKEN` | Twilio console | Same |
| `TWILIO_FROM_NUMBER` | The Twilio number you bought, E.164, e.g. `+447700900000` | Same |

There is no variable to set for the dashboard login, because there isn't
one by default. See "Running it as a demo" below.

Two things about Vercel variables that are easy to lose an afternoon to.
They only take effect on a **new build**, so adding one does nothing to a
deployment that is already built; redeploy afterwards. And a variable has
to be ticked for **Production** specifically, or production simply never
receives it. `/api/health` shows which ones actually arrived, which settles
"I set it but nothing changed" in one request instead of a deploy cycle.

### 4d. Point Stripe at the deployed webhook

The Stripe CLI only forwards to your own machine, so a deployed site needs
a real endpoint:

1. Stripe dashboard, Developers > Webhooks, Add endpoint.
2. URL: `https://your-project.vercel.app/api/stripe/webhook`.
3. Subscribe it to `checkout.session.completed`.
4. Copy the signing secret it gives you into `STRIPE_WEBHOOK_SECRET` in
   Vercel. It is a different secret from the one the CLI prints locally.

## Running it as a demo

**The dashboard opens without a login.** That is the default, with nothing to
configure, because the point of this deployment is that someone being pitched
to can click straight in. A banner across the top says it is a demo so it can
never be mistaken for a real deployment.

Seed the fictional data it shows with:

```
node scripts/seed-demo.mjs
```

The seed script wipes and refills every table, so re-run it whenever a
visitor has clicked things into a mess.

To put the login back, set `REQUIRE_LOGIN=true` and redeploy. The email and
password sign in returns exactly as it was.

The seeded phone numbers are all in Ofcom's `07700 900xxx` range, reserved
for fiction and unable to reach a real person, and the emails are all
`@example.com`. Lesson times are generated relative to when the script runs,
so the dashboard always looks current.

**Only put fictional data in it.** With no login, anything in the database is
public to anyone who has the URL.

## Before you take real customers

Staging is fine without these. A public, customer facing site is not.

- **Verify a sending domain in Resend** and set `EMAIL_FROM` to an address
  on it. Until then every confirmation email to a learner fails with a 403,
  because the shared `onboarding@resend.dev` sender can only deliver to the
  address that owns the Resend account.
- **Swap Stripe from sandbox to live keys**, and add a live mode webhook.
  Sandbox keys cannot take real money.
- **Register with the ICO.** The booking form collects names, phone
  numbers, emails and postcodes, which means the annual data protection
  fee applies, tier one at 52 pounds a year. Register before launch, not
  after.
- **Put a privacy policy on the public page**, covering what is collected
  and why.
- **Move off the Vercel Hobby plan.** It is explicitly for personal, non
  commercial use, so a live driving school site needs Pro, currently 20 US
  dollars a month.
- **Set `REQUIRE_LOGIN=true`.** Without it there is no login at all and
  every learner's name, phone, email and postcode is public. This is the
  one that matters most the moment real people are in the database.
- **Run the reminder migration and add Twilio credentials** if you want
  lesson reminders. The button is built and reports its own failures, but
  does nothing until `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and
  `TWILIO_FROM_NUMBER` exist.

Google sign in with an email allowlist was built and then removed, because
the deployment became a showcase where a login defeats the point. The
password login is what remains. If you want passwordless later, that work
is in the history rather than lost.

## Two things worth knowing before launch

The postcode coverage check on the public page calls postcodes.io, a
free, open, unauthenticated API, directly from the server. This has now
been tested against the live API: the base postcode returns 0 miles,
a central London postcode returns 4.8 miles and is covered, Edinburgh
returns 326.7 miles and is not, and an invalid postcode is rejected with
a clear message.

Under `REQUIRE_LOGIN`, the dashboard's protection (`proxy.ts`) checks your
session with Supabase on every dashboard request, which is the pattern
Supabase's own Next.js integration recommends because it also refreshes
your session cookie. Next.js's own newer guidance favours a lighter, cookie
only check in Proxy for high traffic sites. At the scale of a single
school's dashboard this is not a real concern, it is just worth knowing if
this ever becomes a busier, multi school product later.

With the dashboard open, there is no session, so row level security would
refuse every query. `lib/supabase/server.ts` falls back to the service role
key in that case. The key stays server side, but it is the reason an open
dashboard must only ever hold fictional data: it can read and write
everything.

## What is built, and what is not

Built beyond the version one core:

- **Stripe payment links.** Generate one per booking from the payments page;
  a webhook marks the booking and payment row paid when the customer pays,
  and revalidates the dashboard so it does not serve a stale page. Verified
  end to end against a real sandbox payment. Still on sandbox keys.
- **Confirmation emails** through Resend, on enquiry and on booking. Sending
  is best effort: a failure is logged and the enquiry or booking still
  saves, because losing a booking to a bounced email would be far worse.
  Lesson times are pinned to `Europe/London`, since the server runs UTC and
  would otherwise tell learners to turn up an hour early all summer.
- **SMS lesson reminders** through Twilio, sent by hand from the lessons
  page rather than on a schedule, with the page flagging which lessons fall
  within 24 hours and within 2 hours. Needs credentials before it will send.

Still not built: live self service booking against instructor calendars,
multi instructor support, and automatic waiting list notifications. Booking
status and payment status are still manual toggles. See the roadmap in
`driving_school_platform_plan.md` for the order these are meant to come in.

One thing this platform will never do: book a DVSA practical test on a
learner's behalf. As of April 2026, DVSA rules make that the learner's
job alone, third party tools and instructors are explicitly barred from
booking a test for someone else. The footer on every page says as much.
