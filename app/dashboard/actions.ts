"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/email";
import { sendLessonReminder } from "@/lib/sms";

// Every action here runs with the owner's authenticated session, so row
// level security (see supabase/migrations/0001_init.sql) allows these
// reads and writes. There is no separate admin key involved.

export async function convertEnquiryToBooking(formData: FormData) {
  const supabase = await createClient();

  const enquiryId = formData.get("enquiryId") as string;
  const instructorId = formData.get("instructorId") as string;
  const startTime = formData.get("startTime") as string;

  const { data: enquiry, error: fetchError } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", enquiryId)
    .single();

  if (fetchError || !enquiry) {
    throw new Error("Could not find that enquiry.");
  }

  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + enquiry.duration_minutes * 60000);

  // Find or create a student record for this person, matched by email.
  let studentId: string | null = null;
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("email", enquiry.email)
    .maybeSingle();

  if (existingStudent) {
    studentId = existingStudent.id;
  } else {
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        postcode: enquiry.postcode,
      })
      .select("id")
      .single();

    if (studentError) {
      throw new Error("Could not create a student record.");
    }
    studentId = newStudent.id;
  }

  const { error: bookingError } = await supabase.from("bookings").insert({
    enquiry_id: enquiry.id,
    student_id: studentId,
    instructor_id: instructorId,
    lesson_type_id: enquiry.lesson_type_id,
    lesson_type_name: enquiry.lesson_type_name,
    price_gbp: enquiry.price_gbp,
    duration_minutes: enquiry.duration_minutes,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    status: "confirmed",
    payment_status: "unpaid",
  });

  if (bookingError) {
    throw new Error("Could not create the booking.");
  }

  await supabase
    .from("enquiries")
    .update({ status: "converted" })
    .eq("id", enquiryId);

  const { data: instructor } = await supabase
    .from("instructors")
    .select("name")
    .eq("id", instructorId)
    .single();

  await sendBookingConfirmation({
    name: enquiry.name,
    email: enquiry.email,
    lessonTypeName: enquiry.lesson_type_name,
    priceGbp: enquiry.price_gbp,
    startTime: startDate,
    instructorName: instructor?.name ?? "your instructor",
  });

  revalidatePath("/dashboard/enquiries");
  revalidatePath("/dashboard/lessons");
}

export async function updateEnquiryStatus(enquiryId: string, status: string) {
  const supabase = await createClient();
  await supabase.from("enquiries").update({ status }).eq("id", enquiryId);
  revalidatePath("/dashboard/enquiries");
}

export async function moveEnquiryToWaitingList(formData: FormData) {
  const supabase = await createClient();
  const enquiryId = formData.get("enquiryId") as string;

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", enquiryId)
    .single();

  if (!enquiry) return;

  await supabase.from("waiting_list").insert({
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    postcode: enquiry.postcode,
    lesson_type_id: enquiry.lesson_type_id,
    lesson_type_name: enquiry.lesson_type_name,
    preferred_area: enquiry.postcode,
    preferred_times: enquiry.preferred_time_notes,
  });

  await supabase
    .from("enquiries")
    .update({ status: "waiting" })
    .eq("id", enquiryId);

  revalidatePath("/dashboard/enquiries");
  revalidatePath("/dashboard/waiting-list");
}

export async function removeFromWaitingList(waitingListId: string) {
  const supabase = await createClient();
  await supabase.from("waiting_list").delete().eq("id", waitingListId);
  revalidatePath("/dashboard/waiting-list");
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ status }).eq("id", bookingId);
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/payments");
}

export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: string
) {
  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/lessons");
}

export async function createPaymentLink(bookingId: string) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, students(email, name)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    throw new Error("Could not find that booking.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(Number(booking.price_gbp) * 100),
          product_data: { name: booking.lesson_type_name },
        },
        quantity: 1,
      },
    ],
    customer_email: booking.students?.email ?? undefined,
    metadata: { booking_id: booking.id },
    success_url: `${siteUrl}/dashboard/payments?paid=1`,
    cancel_url: `${siteUrl}/dashboard/payments`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout link.");
  }

  await supabase.from("payments").insert({
    booking_id: booking.id,
    amount_gbp: booking.price_gbp,
    status: "pending",
    provider: "stripe",
    provider_reference: session.id,
  });

  revalidatePath("/dashboard/payments");
  redirect(`/dashboard/payments?link=${encodeURIComponent(session.url)}`);
}

export async function sendReminder(bookingId: string) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, students(name, phone)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    throw new Error("Could not find that booking.");
  }

  if (!booking.students?.phone) {
    redirect("/dashboard/lessons?sms=No+phone+number+on+file+for+that+student.");
  }

  const result = await sendLessonReminder({
    name: booking.students.name,
    phone: booking.students.phone,
    lessonTypeName: booking.lesson_type_name,
    startTime: new Date(booking.start_time),
  });

  if (!result.ok) {
    redirect(`/dashboard/lessons?sms=${encodeURIComponent(result.reason)}`);
  }

  await supabase
    .from("bookings")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", bookingId);

  revalidatePath("/dashboard/lessons");
  redirect("/dashboard/lessons?sms=sent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
