// Server only. Unlike the confirmation emails in lib/email.ts, sending here is
// started by the owner clicking a button, so a failure is reported back rather
// than swallowed into the log: they need to know a learner was not reached.

import twilio from "twilio";
import { business } from "@/config/business";

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilio() {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return twilioClient;
}

// Twilio needs E.164. UK numbers are usually stored the way people write them,
// as 07887725353, which Twilio rejects.
export function toE164(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("07")) return `+44${digits.slice(1)}`;
  if (digits.startsWith("447")) return `+${digits}`;

  return null;
}

export async function sendLessonReminder(reminder: {
  name: string;
  phone: string;
  lessonTypeName: string;
  startTime: Date;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const to = toE164(reminder.phone);

  if (!to) {
    return { ok: false, reason: `"${reminder.phone}" is not a UK mobile number.` };
  }

  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER
  ) {
    return { ok: false, reason: "Twilio is not configured yet." };
  }

  // Pinned to UK time for the same reason as the emails: the server runs UTC.
  const when = reminder.startTime.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    await getTwilio().messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER,
      body: `Hi ${reminder.name.split(" ")[0]}, a reminder that your ${reminder.lessonTypeName.toLowerCase()} is ${when}. ${business.schoolName}, ${business.contactPhone}.`,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send reminder", error);
    return { ok: false, reason: message };
  }
}
