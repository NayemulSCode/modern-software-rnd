"use client";

import { useEffect } from "react";

/**
 * Catches anything thrown while rendering a page in this group. It sits
 * inside the layout, so the sidebar and the player keep working — only the
 * page area is replaced. Error boundaries must be Client Components.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In a real app, send this to your error reporting service.
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="max-w-xl py-10">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 font-display text-6xl leading-none">That page skipped.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        The rest of the app is still running. You can try this page again or pick another from the sidebar.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-ink-faint">Reference: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-paper transition-colors hover:bg-signal"
      >
        Try again
      </button>
    </div>
  );
}
