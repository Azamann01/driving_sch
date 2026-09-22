import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/SubmitButton";
import { ContactLinks } from "@/components/ContactLinks";
import {
  formatLessonClock,
  formatLessonTime,
  lessonDayLabel,
} from "@/lib/dates";
import { sendReminder, updateBookingStatus } from "../actions";

// How close a lesson has to be before the dashboard nudges you to text the
// learner. Reminders are sent by hand, so these only decide what gets flagged.
const DUE_SOON_HOURS = 24;
const DUE_NOW_HOURS = 2;

export const metadata = { title: "Confirmed lessons" };

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ sms?: string }>;
}) {
  const { sms } = await searchParams;
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, instructors(name), students(name, phone, email)")
    .in("status", ["pending", "confirmed"])
    .order("start_time", { ascending: true });

  // Read once per request rather than per lesson, so every badge on the page
  // is measured against the same instant. The purity rule guards client
  // re-renders and memoisation, neither of which applies to a server component
  // that renders once per request, and "due soon" needs the actual clock.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const lessons = bookings?.map((booking) => {
    const start = new Date(booking.start_time);
    const hoursAway = (start.getTime() - now) / 3_600_000;

    return {
      booking,
      dayLabel: lessonDayLabel(start, new Date(now)),
      dueNow: hoursAway > 0 && hoursAway <= DUE_NOW_HOURS,
      dueSoon: hoursAway > DUE_NOW_HOURS && hoursAway <= DUE_SOON_HOURS,
    };
  });

  return (
    <div>
      <h1 className="text-xl font-semibold">Confirmed lessons</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upcoming lessons, soonest first. Mark a lesson completed, cancelled or
        a no show once it has happened.
      </p>

      {sms === "sent" && (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Reminder text sent.
        </p>
      )}
      {sms && sms !== "sent" && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          Reminder not sent. {sms}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {lessons?.length === 0 && (
          <p className="text-sm text-zinc-500">No upcoming lessons yet.</p>
        )}

        {lessons?.map(({ booking, dayLabel, dueNow, dueSoon }) => {
          const markCompleted = updateBookingStatus.bind(null, booking.id, "completed");
          const markCancelled = updateBookingStatus.bind(null, booking.id, "cancelled");
          const markNoShow = updateBookingStatus.bind(null, booking.id, "no_show");
          const remind = sendReminder.bind(null, booking.id);

          return (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {/* "Today, 15:30" beats "Mon 21 Sept, 15:30" when you are
                      glancing at this between lessons. Times are pinned to UK
                      time in lib/dates.ts, since the server runs UTC. */}
                  {dayLabel ? (
                    <>
                      {dayLabel}, {formatLessonClock(new Date(booking.start_time))}
                    </>
                  ) : (
                    formatLessonTime(new Date(booking.start_time))
                  )}
                  {dueNow && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-normal text-red-800">
                      within {DUE_NOW_HOURS}h
                    </span>
                  )}
                  {dueSoon && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">
                      within {DUE_SOON_HOURS}h
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-600">
                  {booking.students?.name ?? "Unknown student"},{" "}
                  {booking.lesson_type_name}, £{booking.price_gbp}, with{" "}
                  {booking.instructors?.name ?? "an instructor"}
                </p>
                {/* If a lesson is in an hour and you are running late, this is
                    the screen you are looking at, so the learner's number has
                    to be on it. */}
                <ContactLinks
                  phone={booking.students?.phone}
                  email={booking.students?.email}
                />
                <p className="text-xs text-zinc-400">
                  Payment: {booking.payment_status.replace("_", " ")}
                  {booking.reminder_sent_at
                    ? `, reminded ${new Date(
                        booking.reminder_sent_at
                      ).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ", not reminded yet"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <form action={markCompleted}>
                  <SubmitButton
                    pendingLabel="Saving..."
                    className="bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
                  >
                    Mark completed
                  </SubmitButton>
                </form>
                <form action={remind}>
                  <SubmitButton
                    pendingLabel="Sending..."
                    className="border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
                  >
                    Send reminder
                  </SubmitButton>
                </form>
                {/* Hidden once the row wraps, otherwise it dangles at the end
                    of a line with nothing after it. */}
                <span className="hidden h-5 w-px bg-zinc-200 sm:block" aria-hidden />
                <form action={markCancelled}>
                  <SubmitButton
                    pendingLabel="Cancelling..."
                    confirm="Cancel this lesson? The learner is not told automatically."
                    className="px-2 py-1.5 text-zinc-500 hover:text-red-700"
                  >
                    Cancel
                  </SubmitButton>
                </form>
                <form action={markNoShow}>
                  <SubmitButton
                    pendingLabel="Saving..."
                    confirm="Mark this lesson as a no show?"
                    className="px-2 py-1.5 text-zinc-500 hover:text-red-700"
                  >
                    No show
                  </SubmitButton>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
