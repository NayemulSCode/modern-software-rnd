import { type ReactNode, ViewTransition } from "react";

/**
 * Lesson 11, pattern 1. Wrap streamed content in this and it fades in when
 * <Suspense> swaps the skeleton for the real thing. `default="none"` stops it
 * from animating during every unrelated transition on the page.
 */
export function Crossfade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="reveal" default="none">
      {children}
    </ViewTransition>
  );
}
