"use client";

import { useFormStatus } from "react-dom";

// Server action forms give no feedback while they run, so a second click
// fires the action twice. On "Confirm lesson" that means two bookings for one
// enquiry, so every dashboard action goes through this.

export function SubmitButton({
  children,
  pendingLabel,
  confirm,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) event.preventDefault();
            }
          : undefined
      }
      // min-h-11 is 44px, a comfortable thumb target. Dropped on sm and up,
      // where a mouse does not need it and it would bloat the row.
      className={`min-h-11 rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 ${className}`}
    >
      {pending ? (pendingLabel ?? "Working...") : children}
    </button>
  );
}
