// Server only. Sending is best effort: an enquiry or a booking is worth more
// than its confirmation email, so every function here reports failure by
// returning rather than throwing, and callers carry on.
//
// The Resend client is built lazily for the same reason as the Stripe one
// (see lib/stripe.ts): Next.js evaluates modules at build time, and a missing
// key must not break `next build`.

import { Resend } from "resend";
import { business } from "@/config/business";

let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!);
  }
  return resendClient;
}

// Until a domain is verified in Resend, this has to stay onboarding@resend.dev,
// which can only deliver to the address that owns the Resend account.
function fromAddress() {
  const address = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  return `${business.schoolName} <${address}>`;
}

function signOff() {
  return `${business.schoolName}\n${business.contactEmail}\n${business.contactPhone}`;
}

async function send(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`Skipping email "${subject}", RESEND_API_KEY is not set.`);
    return;
  }

  const { error } = await getResend().emails.send({
    from: fromAddress(),
    to,
    subject,
    text,
  });

  if (error) {
    console.error(`Failed to send email "${subject}"`, error);
  }
}

export async function sendEnquiryConfirmation(enquiry: {
  name: string;
  email: string;
  lessonTypeName: string;
  preferredDate?: string | null;
}) {
  const preferred = enquiry.preferredDate
    ? `\nYou asked about ${enquiry.preferredDate}. We will confirm a time that works, or suggest the nearest one we have.`
    : "";

  await send(
    enquiry.email,
    `We have got your enquiry, ${enquiry.name.split(" ")[0]}`,
    `Hi ${enquiry.name},

Thanks for getting in touch about a ${enquiry.lessonTypeName.toLowerCase()}.
${preferred}
This is a request rather than a confirmed booking, so nothing is charged yet.
We will come back to you shortly to agree a time.

${signOff()}`
  );
}

export async function sendBookingConfirmation(booking: {
  name: string;
  email: string;
  lessonTypeName: string;
  priceGbp: number;
  startTime: Date;
  instructorName: string;
}) {
  // Pinned to UK time on purpose: the server runs in UTC in production, which
  // would show the wrong hour through British Summer Time.
  const when = booking.startTime.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  await send(
    booking.email,
    `Your lesson is confirmed for ${when}`,
    `Hi ${booking.name},

Your ${booking.lessonTypeName.toLowerCase()} is confirmed.

When: ${when}
Instructor: ${booking.instructorName}
Price: £${booking.priceGbp}

If you need to move or cancel it, reply to this email or call us as early as
you can.

${signOff()}`
  );
}
