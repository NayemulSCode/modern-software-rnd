"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";

/**
 * Lesson 03. A list can show dozens of tracks. `prefetch={true}` on every row
 * would call the server once per row as it scrolls into view. Instead:
 *
 * - before any intent: "auto" — only the shared /track/[id] App Shell is
 *   prefetched, once, for all rows;
 * - on hover, focus or touch: `true` — this one track's cached content is
 *   fetched too, so it is ready by the time the click lands.
 */
export function TrackLink({ trackId, className, children }: { trackId: string; className?: string; children: ReactNode }) {
  const [hasIntent, setHasIntent] = useState(false);
  const showIntent = () => setHasIntent(true);

  return (
    <Link
      href={`/track/${trackId}`}
      prefetch={hasIntent ? true : "auto"}
      onMouseEnter={showIntent}
      onFocus={showIntent}
      onTouchStart={showIntent}
      className={className}
    >
      {children}
    </Link>
  );
}
