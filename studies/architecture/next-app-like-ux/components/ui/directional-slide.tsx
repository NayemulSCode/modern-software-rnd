import { type ReactNode, ViewTransition } from "react";

// Maps a transition type (set by <Link transitionTypes={[...]}> ) to the CSS
// class that globals.css animates. Anything else — browser back, a Suspense
// reveal, a refresh — gets no slide.
const directionalSlide = {
  "nav-back": "nav-back",
  "nav-forward": "nav-forward",
  default: "none",
};

/**
 * Lesson 11, pattern 3. The same `name` on the old and new page tells the
 * browser these are the same region, so it can slide one out and one in.
 * Scoping it to the content keeps the sidebar and player perfectly still.
 */
export function DirectionalSlide({ children, name }: { children: ReactNode; name: string }) {
  return (
    <ViewTransition default="none" name={name} share={directionalSlide}>
      {children}
    </ViewTransition>
  );
}
