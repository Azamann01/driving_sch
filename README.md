# Driving school booking platform

Three screens: a public page, a booking screen, and an owner dashboard. See
`driving_school_platform_plan.md` for the full reasoning behind the scope
and technology choices, this file is just the practical setup steps.

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
3. In the Supabase dashboard, go to the SQL Editor, paste the contents of
   `supabase/migrations/0001_init.sql`, and run it. This creates every
   table (instructors, students, enquiries, bookings, payments, waiting
   list) and the row level security policies that keep the public site
   able to submit enquiries but not read anyone else's data.
4. Go to Authentication, then Users, and add yourself as a user with an
   email and password. This is how you will sign in to the dashboard,
   there is no public signup form by design, since this is a single
   owner operated dashboard, not a multi user product yet.
5. Go to the Table Editor, open the instructors table, and add at least
   one row (name, email, phone) so you have someone to assign lessons to
   from the dashboard. There is deliberately no instructor management
   screen in version one, add and edit instructors directly here for now.

## 3. Run it locally

```
npm install
npm run dev
```

Visit `http://localhost:3000` for the public page, `/book` for the
booking form, and `/dashboard/login` to sign in with the user you created
in step 2.

## 4. Deploy

Deploy to a staging URL first and keep it there until everything in
"Before you take real customers" below is done. Staging runs against the
same Supabase project and the same Stripe sandbox, so it is safe to click
around, but it must not be handed to learners yet.

### 4a. Push the code

1. `git init && git add . && git commit -m "Initial commit"`.
2. Create an empty repository on GitHub and push to it.

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

Do **not** set `DEV_AUTH_BYPASS` in Vercel. It only ever applies when
`NODE_ENV` is `development`, so it cannot unlock a deployed build, but
there is no reason for it to be there.

### 4d. Point Stripe at the deployed webhook

The Stripe CLI only forwards to your own machine, so a deployed site needs
a real endpoint:

1. Stripe dashboard, Developers > Webhooks, Add endpoint.
2. URL: `https://your-project.vercel.app/api/stripe/webhook`.
3. Subscribe it to `checkout.session.completed`.
4. Copy the signing secret it gives you into `STRIPE_WEBHOOK_SECRET` in
   Vercel. It is a different secret from the one the CLI prints locally.

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
- **Replace the password login.** Owner sign in is still email and
  password; Google sign in plus an email allowlist was the plan.

## Two things worth knowing before launch

The postcode coverage check on the public page calls postcodes.io, a
free, open, unauthenticated API, directly from the server. This has now
been tested against the live API: the base postcode returns 0 miles,
a central London postcode returns 4.8 miles and is covered, Edinburgh
returns 326.7 miles and is not, and an invalid postcode is rejected with
a clear message.

The dashboard's login protection (`proxy.ts`) checks your session with
Supabase on every dashboard request, which is the pattern Supabase's own
Next.js integration recommends because it also refreshes your session
cookie. Next.js's own newer guidance favours a lighter, cookie only check
in Proxy for high traffic sites. At the scale of a single school's
dashboard this is not a real concern, it is just worth knowing if this
ever becomes a busier, multi school product later.

## What is deliberately not built yet

Automatic payment links, SMS reminders, live self service instructor
calendars, and multi instructor support are all phase two and three, not
version one. Outstanding payments and booking status are updated with a
manual toggle in the dashboard for now. See the roadmap section of
`driving_school_platform_plan.md` for the reasoning and the order this is
meant to be tackled in.

One thing this platform will never do: book a DVSA practical test on a
learner's behalf. As of April 2026, DVSA rules make that the learner's
job alone, third party tools and instructors are explicitly barred from
booking a test for someone else. The footer on every page says as much.
