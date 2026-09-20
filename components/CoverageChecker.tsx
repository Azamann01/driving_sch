"use client";

import { useState } from "react";

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "covered"; distanceMiles: number }
  | { status: "not-covered"; distanceMiles: number }
  | { status: "error"; message: string };

export function CoverageChecker() {
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState<CheckState>({ status: "idle" });

  async function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    setState({ status: "checking" });

    try {
      const response = await fetch("/api/postcode-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong." });
        return;
      }

      setState(
        data.covered
          ? { status: "covered", distanceMiles: data.distanceMiles }
          : { status: "not-covered", distanceMiles: data.distanceMiles }
      );
    } catch {
      setState({ status: "error", message: "Could not check that postcode right now." });
    }
  }

  return (
    <div id="coverage" className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
      <h3 className="text-base font-semibold">Check we cover your area</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Enter your postcode to see if it falls within our usual pickup range.
      </p>
      <form onSubmit={handleCheck} className="mt-4 flex gap-2">
        {/* A placeholder is not a label: it disappears as soon as you type,
            and screen readers do not reliably announce it. */}
        <label htmlFor="coverage-postcode" className="sr-only">
          Your postcode
        </label>
        <input
          id="coverage-postcode"
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. SW1A 1AA"
          autoComplete="postal-code"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-base focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 sm:py-2 sm:text-sm"
          required
        />
        <button
          type="submit"
          disabled={state.status === "checking"}
          className="shrink-0 rounded-md bg-zinc-900 px-4 py-2.5 text-base font-medium text-white hover:bg-zinc-700 disabled:opacity-50 sm:py-2 sm:text-sm"
        >
          {state.status === "checking" ? "Checking..." : "Check"}
        </button>
      </form>

      {/* The result replaces itself in place, so it is announced rather than
          silently appearing for anyone not watching the screen. */}
      <div role="status" aria-live="polite">
      {state.status === "covered" && (
        <p className="mt-3 text-sm text-green-700">
          Good news, that is about {state.distanceMiles} miles from us, well within
          our coverage area.
        </p>
      )}
      {state.status === "not-covered" && (
        <p className="mt-3 text-sm text-amber-700">
          That is about {state.distanceMiles} miles from us, a little outside our
          usual coverage. Send an enquiry anyway and we will let you know if we
          can still help.
        </p>
      )}
      {state.status === "error" && (
        <p className="mt-3 text-sm text-red-700">{state.message}</p>
      )}
      </div>
    </div>
  );
}
