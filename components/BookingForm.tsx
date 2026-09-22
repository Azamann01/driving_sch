"use client";

import { useState } from "react";
import { business } from "@/config/business";

type SubmitState = "idle" | "submitting" | "success" | "error";

// Shared so every control on the form focuses the same way. Without a visible
// focus ring, anyone filling this in by keyboard cannot see where they are.
//
// text-base below sm is not a style choice: iOS Safari zooms the whole page in
// when you focus an input under 16px, and the learner then has to pinch back
// out on every field. The 16px + py-2.5 combination also lands the control at
// a 44px tap target. Desktop keeps the tighter 14px.
// min-h-11 (44px) catches selects, which render a couple of pixels shorter
// than inputs given the same padding. Dropped on sm and up, where the tighter
// desktop sizing is fine.
const fieldStyles =
  "mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2.5 text-base focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 sm:min-h-0 sm:py-2 sm:text-sm";

export function BookingForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      postcode: formData.get("postcode"),
      lessonTypeId: formData.get("lessonTypeId"),
      preferredDate: formData.get("preferredDate"),
      preferredTimeNotes: formData.get("preferredTimeNotes"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }

      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Could not reach the server, please try again.");
    }
  }

  if (state === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800"
      >
        <h3 className="font-semibold">Thanks, your enquiry is in.</h3>
        <p className="mt-2 text-sm">
          We will get back to you to confirm a time. If it is urgent, call or
          email us using the details in the footer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Phone" name="phone" type="tel" required autoComplete="tel" />
      </div>

      <Field label="Email" name="email" type="email" required autoComplete="email" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Postcode"
          name="postcode"
          required
          placeholder="e.g. SW1A 1AA"
          autoComplete="postal-code"
        />
        <div>
          <label
            htmlFor="lessonTypeId"
            className="block text-sm font-medium text-zinc-700"
          >
            Lesson type
          </label>
          <select
            id="lessonTypeId"
            name="lessonTypeId"
            required
            className={fieldStyles}
            defaultValue=""
          >
            <option value="" disabled>
              Choose a lesson type
            </option>
            {business.lessonTypes.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name} (£{lesson.price})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred date" name="preferredDate" type="date" />
        <Field
          label="Preferred time"
          name="preferredTimeNotes"
          placeholder="e.g. weekday evenings"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-zinc-700"
        >
          Anything else we should know?
          <span className="text-zinc-400"> (optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className={fieldStyles}
        />
      </div>

      {state === "error" && (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 sm:w-auto"
      >
        {state === "submitting" ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">
        {label}
        {!required && <span className="text-zinc-400"> (optional)</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={fieldStyles}
      />
    </div>
  );
}
