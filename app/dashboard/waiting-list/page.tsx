import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/SubmitButton";
import { removeFromWaitingList } from "../actions";

export const metadata = { title: "Waiting list" };

export default async function WaitingListPage() {
  const supabase = await createClient();

  const { data: waitingList } = await supabase
    .from("waiting_list")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-semibold">Waiting list</h1>
      <p className="mt-1 text-sm text-zinc-600">
        People waiting for a slot, oldest first. Remove someone once you have
        found them a time, they will show up as a normal enquiry again if you
        convert them from here manually in the meantime.
      </p>

      <div className="mt-6 space-y-3">
        {waitingList?.length === 0 && (
          <p className="text-sm text-zinc-500">No one on the waiting list.</p>
        )}

        {waitingList?.map((entry) => {
          const remove = removeFromWaitingList.bind(null, entry.id);

          return (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4"
            >
              <div>
                <p className="font-medium">{entry.name}</p>
                <p className="text-sm text-zinc-500">
                  {entry.email}, {entry.phone}
                </p>
                <p className="text-sm text-zinc-600">
                  {entry.lesson_type_name}
                  {entry.preferred_area && `, near ${entry.preferred_area}`}
                  {entry.preferred_times && `, ${entry.preferred_times}`}
                </p>
              </div>
              <form action={remove}>
                <SubmitButton
                  pendingLabel="Removing..."
                  confirm={`Remove ${entry.name} from the waiting list? This cannot be undone.`}
                  className="border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 hover:text-red-700"
                >
                  Remove
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
