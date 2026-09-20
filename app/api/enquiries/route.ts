import { NextResponse } from "next/server";
import { createBrowserClient } from "@supabase/ssr";
import { business } from "@/config/business";
import { sendEnquiryConfirmation } from "@/lib/email";

// Uses the anon key deliberately. The enquiries table's row level
// security policy (see supabase/migrations/0001_init.sql) allows the
// anon role to insert but never to read, update or delete, so this is
// safe to expose to unauthenticated visitors submitting the public form.
function createAnonClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const { name, email, phone, postcode, lessonTypeId, preferredDate, preferredTimeNotes, message } =
    body ?? {};

  if (!name || !email || !phone || !postcode || !lessonTypeId) {
    return NextResponse.json(
      { error: "Please fill in every required field." },
      { status: 400 }
    );
  }

  const lessonType = business.lessonTypes.find((l) => l.id === lessonTypeId);

  if (!lessonType) {
    return NextResponse.json(
      { error: "That lesson type is not recognised." },
      { status: 400 }
    );
  }

  const supabase = createAnonClient();

  const { error } = await supabase.from("enquiries").insert({
    name,
    email,
    phone,
    postcode,
    lesson_type_id: lessonType.id,
    lesson_type_name: lessonType.name,
    price_gbp: lessonType.price,
    duration_minutes: lessonType.durationMinutes,
    preferred_date: preferredDate || null,
    preferred_time_notes: preferredTimeNotes || null,
    message: message || null,
  });

  if (error) {
    console.error("Failed to insert enquiry", error);
    return NextResponse.json(
      { error: "Could not submit your enquiry, please try again." },
      { status: 500 }
    );
  }

  await sendEnquiryConfirmation({
    name,
    email,
    lessonTypeName: lessonType.name,
    preferredDate: preferredDate || null,
  });

  return NextResponse.json({ ok: true });
}
