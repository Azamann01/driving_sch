import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/SubmitButton";
import { ContactLinks } from "@/components/ContactLinks";
import { timeAgo } from "@/lib/dates";
import {
  convertEnquiryToBooking,
  moveEnquiryToWaitingList,
  updateEnquiryStatus,
} from "../actions";

export const metadata = { title: "New enquiries" };

// Two days without a reply is where a warm enquiry starts going cold.
const STALE_AFTER_HOURS = 48;

export default async function EnquiriesPage() {
  const supabase = await createClient();

  const [{ data: enquiries }, { data: instructors }] = await Promise.all([
    supabase
      .from("enquiries")
      .select("*")
      .in("status", ["new", "contacted"])
      .order("created_at", { ascending: false }),
    supabase.from("instructors").select("id, name").eq("active", true),
  ]);

  // Read once so every card is measured against the same instant.
  const now = new Date();
  const stale = (createdAt: string) =>
    now.getTime() - new Date(createdAt).getTime() >
    STALE_AFTER_HOURS * 3_600_000;

  return (
    <div>
      <h1 className="text-xl font-semibold">New enquiries</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Enquiries submitted from the public booking form. Convert one into a
        confirmed lesson once you have agreed a time, or put it on the
        waiting list if nothing is free yet.
      </p>

      {(!instructors || instructors.length === 0) && (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          No instructors are set up yet. Add at least one in the Supabase
          table editor (the instructors table) before you can convert an
          enquiry into a booking.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {enquiries?.length === 0 && (
          <p className="text-sm text-zinc-500">No open enquiries right now.</p>
        )}

        {enquiries?.map((enquiry) => {
          const markContacted = updateEnquiryStatus.bind(
            null,
            enquiry.id,
            "contacted"
          );
          const markLost = updateEnquiryStatus.bind(null, enquiry.id, "lost");

          return (
            <div
              key={enquiry.id}
              className="rounded-lg border border-zinc-200 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{enquiry.name}</p>
                  <ContactLinks phone={enquiry.phone} email={enquiry.email} />
                  <p className="mt-1 text-sm text-zinc-500">
                    {enquiry.postcode}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Age, not just status: an enquiry nobody has answered for
                      days is the one worth opening first. */}
                  <span
                    className={`text-xs ${
                      stale(enquiry.created_at) ? "font-medium text-amber-700" : "text-zinc-400"
                    }`}
                  >
                    {timeAgo(new Date(enquiry.created_at), now)}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs capitalize text-zinc-600">
                    {enquiry.status}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm">
                {enquiry.lesson_type_name}, £{enquiry.price_gbp}
                {enquiry.preferred_date && `, preferred date ${enquiry.preferred_date}`}
                {enquiry.preferred_time_notes && `, ${enquiry.preferred_time_notes}`}
              </p>
              {enquiry.message && (
                <p className="mt-1 text-sm text-zinc-600">
                  &ldquo;{enquiry.message}&rdquo;
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-4">
                <form
                  action={convertEnquiryToBooking}
                  className="flex w-full flex-wrap items-end gap-3 sm:w-auto"
                >
                  <input type="hidden" name="enquiryId" value={enquiry.id} />
                  <div className="w-full sm:w-auto">
                    <label
                      htmlFor={`instructor-${enquiry.id}`}
                      className="block text-xs font-medium text-zinc-500"
                    >
                      Instructor
                    </label>
                    <select
                      id={`instructor-${enquiry.id}`}
                      name="instructorId"
                      required
                      defaultValue=""
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-3 text-base sm:w-auto sm:py-1.5 sm:text-sm"
                    >
                      <option value="" disabled>
                        Choose
                      </option>
                      {instructors?.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-auto">
                    <label
                      htmlFor={`start-${enquiry.id}`}
                      className="block text-xs font-medium text-zinc-500"
                    >
                      Start time
                    </label>
                    <input
                      id={`start-${enquiry.id}`}
                      type="datetime-local"
                      name="startTime"
                      required
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-3 text-base sm:w-auto sm:py-1.5 sm:text-sm"
                    />
                  </div>
                  <SubmitButton
                    pendingLabel="Confirming..."
                    className="bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Confirm lesson
                  </SubmitButton>
                </form>

                <form action={moveEnquiryToWaitingList}>
                  <input type="hidden" name="enquiryId" value={enquiry.id} />
                  <SubmitButton
                    pendingLabel="Adding..."
                    className="border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    Add to waiting list
                  </SubmitButton>
                </form>

                {enquiry.status === "new" && (
                  <form action={markContacted}>
                    <SubmitButton
                      pendingLabel="Saving..."
                      className="px-2 py-1.5 text-sm text-zinc-500 hover:text-zinc-800"
                    >
                      Mark contacted
                    </SubmitButton>
                  </form>
                )}

                <form action={markLost}>
                  <SubmitButton
                    pendingLabel="Saving..."
                    confirm="Mark this enquiry as lost? It will drop off this list."
                    className="px-2 py-1.5 text-sm text-zinc-500 hover:text-red-700"
                  >
                    Mark as lost
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
