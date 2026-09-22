// Phone and email as things you can actually act on.
//
// The owner is usually holding a phone when they read this, and the job in
// front of them is almost always "ring this person back". As plain text that
// meant selecting an 11 digit number by hand on a touchscreen.

export function ContactLinks({
  phone,
  email,
}: {
  phone?: string | null;
  email?: string | null;
}) {
  if (!phone && !email) return null;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-4 text-sm">
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500 sm:min-h-0"
        >
          <svg
            className="h-4 w-4 shrink-0 text-zinc-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.5 11.5 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15A13 13 0 0 1 2 5V3.5Z" />
          </svg>
          {phone}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex min-h-11 items-center gap-1.5 break-all text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500 sm:min-h-0"
        >
          <svg
            className="h-4 w-4 shrink-0 text-zinc-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M3 4h14a1 1 0 0 1 1 1v.383l-8 4.2-8-4.2V5a1 1 0 0 1 1-1Z" />
            <path d="M18 7.483V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.483l7.535 3.956a1 1 0 0 0 .93 0L18 7.483Z" />
          </svg>
          {email}
        </a>
      )}
    </p>
  );
}
