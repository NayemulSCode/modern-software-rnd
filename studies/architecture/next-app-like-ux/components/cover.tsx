import clsx from "clsx";
import { coverStyle } from "@/lib/cover-art";

/**
 * Generated cover art. Decorative, so it is hidden from screen readers — the
 * track title next to it already says what it is.
 */
export function Cover({ seed, className }: { seed: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx("aspect-square shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgb(26_22_18/0.18)]", className)}
      style={coverStyle(seed)}
    />
  );
}
