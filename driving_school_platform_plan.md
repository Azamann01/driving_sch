# Driving School Booking Platform: Build Plan

Prepared for Tope Wilson, TechWithTop
6 September 2026

## 1. What we are building

A three screen platform for a single UK driving school, built around the day to day reality of a small instructor led business rather than a big multi school SaaS product from day one. The three screens map directly to the three jobs the business needs done.

The public page tells a prospective learner what the school offers, where it covers, what it costs, and gives them one clear action: book a lesson or send an enquiry.

The booking screen turns that intent into a structured record: lesson type, preferred date, postcode, and contact details, captured cleanly enough that the owner can act on it without a phone call.

The owner dashboard is where the actual business gets run: new enquiries waiting for a response, lessons that are confirmed, payments that are outstanding, and a waiting list for when no instructor slot is free yet.

This plan treats booking and scheduling as the version one core, in line with what you prioritised. Payments, progress tracking, and multi instructor features are sequenced in as phase two and three rather than bolted on from day one.

## 2. An important regulatory boundary, verified

I checked the current DVSA rules before scoping this, because it changes what the platform is allowed to do. As of April 2026, only the learner themselves can book or manage their own practical driving test. Third party booking services, cancellation finder apps, and driving instructors are explicitly barred from booking a test on a learner's behalf, and the DVSA has been actively closing this down to stop bot based bulk booking and reselling.

Practically, this means the platform should never offer to book the DVSA practical test for a customer. Its job stops at managing lessons with the school. An instructor can use it to record that a student looks test ready and to note preferred timing, but the actual test booking has to be left to the learner going to gov.uk directly. Building this in from the start avoids a feature that would be non compliant within months, and it also keeps the product's legal footprint simple.

Sources: Carwow on the 2026 DVSA booking changes, and the DVSA booking rules coverage from Blackcircles and Sujadrivingschool.co.uk (links at the end).

## 3. How the three screens work together

A visitor lands on the public page, sees services and prices, and either recognises their postcode area is covered or is invited to check. If they want to proceed, the booking screen collects lesson type, a preferred date, their postcode, and contact details, and submits this as an enquiry rather than an instantly confirmed slot.

Starting with an enquiry first, confirmation second workflow is a deliberate choice for version one. A small school's real time availability is rarely clean enough to expose as a self service calendar on day one, and building live slot booking properly means solving instructor availability and conflict detection first, which the owner dashboard needs anyway. So version one asks, the owner confirms, and version two can graduate confirmed regulars to instant self service booking once the calendar logic is proven.

Once submitted, the enquiry lands in the owner dashboard's new enquiries list. The owner assigns an instructor and a time, which converts it into a confirmed lesson, or places it on the waiting list if nothing is free. Outstanding payments are tracked separately so unpaid lessons never get lost in the shuffle.

## 4. Data model

A lean set of tables covers version one without overbuilding.

School: base postcode, coverage radius, lesson types and prices, opening hours. Even for a single school, storing this as a row rather than hardcoded config costs nothing now and quietly keeps the door open if this ever becomes a product you license to other schools, matching the SaaS direction of your other work.

Instructor: name, contact details, working hours, vehicle details.

Lesson type: name, duration, price, for example a standard one hour lesson, a two hour block, a motorway lesson, or a mock test.

Enquiry: name, phone, email, postcode, lesson type requested, preferred dates, free text message, status such as new, contacted, converted, or lost, and a timestamp.

Booking: linked instructor, lesson type, start and end time, status such as pending, confirmed, completed, cancelled, or no show, price, and payment status.

Student: name, contact details, postcode, and free text progress notes. Deliberately no provisional licence number or date of birth at this stage, since the booking flow does not need them and it keeps the data you are responsible for to a minimum.

Payment: linked booking, amount, method, status, and provider reference.

Waiting list: linked enquiry or student, lesson type wanted, preferred area or times, and when they joined the list.

## 5. Technology stack, and why

Since you already run OperFlow on Next.js, React, TypeScript, Postgres, and Supabase, the strongest recommendation is to build this on the same stack rather than introduce a second toolchain. You get shared components such as forms, calendar widgets, and the dashboard shell, one hosting and auth pattern to maintain, and a faster build because you are not relearning tooling. There is no compelling reason to reach for anything more specialised for a project this size.

For hosting, Vercel is the natural fit for the Next.js front end, but I checked their terms directly and the free Hobby plan is stated to be for personal, non commercial use only. A live driving school business needs the Pro plan, currently 20 US dollars a month. Worth knowing before you plan around a free tier that does not actually apply here.

Supabase gives you hosted Postgres, authentication for the owner dashboard, and row level security, and its free tier, verified from their pricing page, covers 500 megabytes of database, 50,000 monthly active users, and unlimited API requests, which is comfortably enough for a single school's launch. The one catch is that free projects pause after a week of inactivity, so once this is live and not just in development, budget for the Pro tier at 25 US dollars a month, which also adds daily backups.

For the postcode coverage check on the public page, postcodes.io is free, open, and needs no API key, and it is enough to validate a postcode and get a latitude and longitude to compare against the school's base postcode and coverage radius. If you later want full address autocomplete in the booking form rather than just a postcode, Ideal Postcodes is pay as you go with no subscription, priced between roughly 2.8 and 4.5 pence per completed lookup depending on volume, verified from their current pricing page. At a small school's enquiry volume this is a trivial cost, so it is a reasonable phase two add rather than a version one need.

For payments, I compared Stripe and GoCardless on current UK fee schedules rather than assuming. Stripe charges roughly 1.5 percent plus 20 pence per UK card transaction, settles quickly, and gives an instant, familiar checkout experience, including Apple Pay and Google Pay, which matters for a first time customer paying a deposit online. GoCardless charges 1 percent plus 20 pence capped at 4 pounds per collection, which is meaningfully cheaper for repeat, low value charges such as ongoing lesson packages, but it works over Direct Debit mandates that take a few days to set up and confirm, so it is a poor fit for an instant deposit at the point of booking. The sensible split is Stripe for the first payment or deposit where instant confirmation matters, with GoCardless considered later specifically for recurring package billing once lesson volume makes the fee saving worth the extra integration.

For notifications, start with email only, using a provider such as Resend. Their free tier, verified from their pricing page, covers 3,000 emails a month with a 100 a day cap, which is plenty for booking confirmations and payment reminders at launch. Add SMS reminders in phase two using Twilio, verified at roughly 5.6 US cents per UK message, once no show costs justify the per message spend. I would hold off on WhatsApp Business API for version one. It requires a verified business, pre approved message templates, and per conversation pricing, which is more setup overhead than an MVP warrants when email and SMS already solve the reminder problem.

## 6. Compliance and data protection

The booking form collects personal data, names, phone numbers, emails, and postcodes, so this is not optional. UK organisations processing personal data digitally, with limited exceptions, need to register with the Information Commissioner's Office and pay the annual data protection fee. I checked the current fee schedule directly, and a small business or sole trader typically falls into tier one, currently 52 pounds a year. Register before launch, not after.

Beyond registration, you need a plain English privacy policy on the public page explaining what is collected and why, a lawful basis for processing, which for a booking system is straightforwardly contractual necessity, and a sensible data retention policy so old enquiries and cancelled bookings do not accumulate indefinitely. Keeping the student data model deliberately minimal, as noted above, also reduces how much you are exposed to if anything ever goes wrong.

## 7. Phased roadmap

Phase zero, this week: lock the lesson types and prices, define the coverage radius from the school's base postcode, wireframe the three screens at a basic level, and set up the repository, hosting, and database schema.

Phase one, the version one core, roughly two to three weeks: the public page with static content and the postcode coverage check, the booking screen submitting enquiries into the database with an automatic confirmation email, and the owner dashboard showing new enquiries, letting the owner convert an enquiry into a confirmed lesson by assigning an instructor and time, a simple list or calendar view of confirmed lessons, and a manual toggle for payment received alongside a Stripe payment link sent by email.

Phase two, roughly the following month: an outstanding payments view with automatically generated Stripe payment links and a webhook that marks a booking paid the moment it is, a working waiting list that notifies someone automatically when a slot frees up, SMS reminders through Twilio, and basic per lesson progress notes against each student.

Phase three, once the business volume justifies it: genuine self service booking against live instructor calendars with conflict checking, package or credit based bookings billed through GoCardless, support for multiple instructors, and, only if you decide to take this in the SaaS direction, a proper multi school version building on the school level data already modelled in step four.

## 8. What this costs to run

At launch, expect roughly 20 pounds a month for Vercel Pro, since the free tier is explicitly non commercial, plus Supabase on the free tier initially, moving to about 25 US dollars a month once the project is live continuously rather than sitting idle in development. Postcode checking on postcodes.io is free. Email through Resend is free at launch volumes. Stripe and GoCardless charge only as a percentage of what is actually collected, so there is no fixed cost there. Add the 52 pounds a year ICO registration and a domain name at roughly 10 to 15 pounds a year. All in, a realistic monthly platform cost at launch sits somewhere around 20 to 30 pounds a month in fixed fees, plus payment processing percentages, before your own time. That is a genuinely lean number, whether this is your own school or a proposal for a client.

## 9. Open decisions before building starts

A few things are worth deciding explicitly rather than defaulting into. Whether the coverage radius is a straight line distance from the school's base postcode or a list of specific postcode districts, since the latter is more accurate for how driving schools usually think about their patch but needs slightly more setup data. Whether the owner wants email only notifications at launch or is willing to add SMS from day one given the low per message cost. And whether this is being built purely for one school, in which case the school level table in the data model can be simplified, or with half an eye on reselling it later, in which case it is worth keeping now while it costs nothing extra.

## Sources checked

DVSA driving test booking changes 2026, Carwow: https://www.carwow.co.uk/news/10823/dvsa-driving-test-booking-changes-2026
DVSA rule changes context, Blackcircles: https://www.blackcircles.com/news/uk-driving-test-rule-changes-may-2026
Postcode and geolocation API, Postcodes.io: https://postcodes.io/
Address lookup pricing, Ideal Postcodes: https://ideal-postcodes.co.uk/pricing
GoCardless vs Stripe comparison, Business Expert: https://www.businessexpert.co.uk/payment-processing/gocardless-vs-stripe/
Twilio UK SMS pricing: https://www.twilio.com/en-us/sms/pricing/gb
Resend pricing: https://resend.com/pricing
Supabase pricing: https://supabase.com/pricing
Vercel pricing and Hobby plan terms: https://vercel.com/pricing
ICO data protection fee tiers: https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/
Driving school software feature benchmark, DriveSchoolPro: https://driveschoolpro.com/blog/best-driving-school-software/
