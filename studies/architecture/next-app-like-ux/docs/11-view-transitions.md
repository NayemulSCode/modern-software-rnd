# View Transitions

## The problem

When everything responds instantly, changes can be too abrupt to follow. A row vanishes and the list below jumps up. A skeleton is replaced by content in a single frame. The user moves to the next track and cannot tell whether they went forward or back.

## The rule

**Animate to explain what changed, not to decorate.** Each animation should answer one question: what appeared, what moved, or which direction did I go?

React's `<ViewTransition>` component uses the browser's View Transitions API. It needs no configuration in the App Router. It only animates updates that happen inside a **transition**: navigations, `startTransition`, and `<Suspense>` reveals. A plain `setState` does not trigger it.

## Pattern 1: reveals — "this just arrived"

```tsx
// components/ui/crossfade.tsx
import { type ReactNode, ViewTransition } from "react";

export function Crossfade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="reveal" default="none">
      {children}
    </ViewTransition>
  );
}
```

```css
/* app/globals.css */
::view-transition-new(.reveal) {
  animation: 260ms ease-out both fade-in;
}
```

Wrap streamed content in it and it fades in when Suspense swaps out the skeleton:

```tsx
<Suspense fallback={<TrackListSkeleton rows={5} />}>
  <Crossfade>
    <MoreLikeThis id={id} />
  </Crossfade>
</Suspense>
```

`default="none"` matters. Without it, this element would also animate during every other transition on the page.

## Pattern 2: morphs — "this moved"

When a favorite is removed, the rows below should slide up, not teleport. Wrap each **keyed** item in a `<ViewTransition>`:

```tsx
// features/track/components/favorites-feed.tsx
{tracks.map((track, index) => (
  <ViewTransition key={track.id}>
    <li className="transition-opacity has-data-removing:opacity-40">
      <TrackRow track={track} index={index} />
    </li>
  </ViewTransition>
))}
```

React captures each row's position before and after the update and the browser animates between them. This works because the favorite toggle already runs inside a transition (lesson 08). The same technique animates reordering in `playlist-editor.tsx`.

The section under the list moves too, so it gets its own wrapper:

```tsx
// app/(app)/favorites/page.tsx
<ViewTransition>
  <section>…You might also like…</section>
</ViewTransition>
```

## Pattern 3: direction — "I went forward"

Label the navigation on the link:

```tsx
// app/(app)/track/[id]/page.tsx
<Link href={`/track/${neighbors.previous.id}`} prefetch={true} transitionTypes={["nav-back"]}>…</Link>
<Link href={`/track/${neighbors.next.id}`} prefetch={true} transitionTypes={["nav-forward"]}>…</Link>
```

Map the label to an animation on the content that changes:

```tsx
// components/ui/directional-slide.tsx
const directionalSlide = {
  "nav-back": "nav-back",
  "nav-forward": "nav-forward",
  default: "none",
};

export function DirectionalSlide({ children, name }: { children: ReactNode; name: string }) {
  return (
    <ViewTransition default="none" name={name} share={directionalSlide}>
      {children}
    </ViewTransition>
  );
}
```

```css
/* app/globals.css */
::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation: 200ms ease-in-out both slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation: 200ms ease-in-out both slide;
}
```

Forward: old content leaves to the left, new content enters from the right. Back mirrors it. `default: "none"` means a normal link, the browser's back button or a refresh does not slide.

### Keep fixed things fixed

The player bar must not slide with the page. Give it a name and switch its animation off:

```tsx
// components/now-playing-bar.tsx
<section style={{ viewTransitionName: "player-bar" }}>…</section>
```

```css
::view-transition-group(player-bar) { animation: none; z-index: 100; }
::view-transition-old(player-bar)   { display: none; }
::view-transition-new(player-bar)   { animation: none; }
```

## Two rules that are not optional

```css
/* Clicks must still work while an animation runs. */
::view-transition {
  pointer-events: none;
}

/* Movement can make people feel ill. Respect the OS setting. */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

## Try it

1. Open Favorites and remove one from the middle of the list. The row dims, then the rows below glide up.
2. Open a track and use the previous / next links at the bottom of the header. The content slides in the direction you chose; the sidebar and the player do not move.
3. Use the browser's back button. No slide: that navigation has no type.
4. Turn on "Reduce motion" in your operating system and repeat. Everything still works, without movement.

## Common mistakes

- **Animating everything.** If every change moves, nothing stands out and the app feels slower.
- **Long durations.** Stay around 150–300ms. The user is waiting for the animation to finish.
- **Forgetting `default="none"`** on named or enter-only transitions.
- **Putting the wrapper in a layout.** Layouts persist, so enter and exit never fire there. Put it in the page.
- **The same `name` twice on one page.** Names must be unique at any moment, or the transition is skipped.
- **Assuming every browser animates.** Older browsers skip the animation and show the change at once. That is fine: the app must work without it.

Next: [Testing instant navigation](./12-testing.md)
