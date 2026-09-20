import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/SubmitButton";
import { createPaymentLink, updatePaymentStatus } from "../actions";

export const metadata = { title: "Outstanding payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; paid?: string }>;
}) {
  const { link, paid } = await searchParams;
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, students(name, email)")
    .neq("payment_status", "paid")
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  const totalOutstanding =
    bookings?.reduce((sum, b) => sum + Number(b.price_gbp), 0) ?? 0;

  return (
    <div>
      <h1 className="text-xl font-semibold">Outstanding payments</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Lessons that are not yet marked paid. Total outstanding: £
        {totalOutstanding.toFixed(2)}.
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        Generate a Stripe payment link to send to a customer, or toggle
        payment status manually if they paid another way.
      </p>

      {paid === "1" && (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Redirected back from Stripe. If the payment succeeded, this booking
          will flip to paid automatically once the webhook fires, usually
          within a few seconds.
        </p>
      )}

      {link && (
        <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-medium">Payment link ready, send this to the customer:</p>
          <p className="mt-1 break-all font-mono text-xs">{link}</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {bookings?.length === 0 && (
          <p className="text-sm text-zinc-500">Nothing outstanding.</p>
        )}

        {bookings?.map((booking) => {
          const markPaid = updatePaymentStatus.bind(null, booking.id, "paid");
          const markPartial = updatePaymentStatus.bind(
            null,
            booking.id,
            "partially_paid"
          );
          const generateLink = createPaymentLink.bind(null, booking.id);

          return (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4"
            >
              <div>
                <p className="font-medium">
                  {booking.students?.name ?? "Unknown student"}, £
                  {booking.price_gbp}
                </p>
                <p className="text-sm text-zinc-500">
                  {booking.lesson_type_name},{" "}
                  {new Date(booking.start_time).toLocaleDateString("en-GB")},{" "}
                  currently {booking.payment_status.replace("_", " ")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <form action={markPaid}>
                  <SubmitButton
                    pendingLabel="Saving..."
                    className="bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
                  >
                    Mark paid
                  </SubmitButton>
                </form>
                <form action={generateLink}>
                  <SubmitButton
                    pendingLabel="Creating link..."
                    className="border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
                  >
                    Generate payment link
                  </SubmitButton>
                </form>
                <form action={markPartial}>
                  <SubmitButton
                    pendingLabel="Saving..."
                    className="px-2 py-1.5 text-zinc-500 hover:text-amber-700"
                  >
                    Mark partially paid
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
