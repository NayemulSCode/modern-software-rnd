# Streaming with Suspense

## The problem

A page has a fast part and a slow part. If you wait for both, the fast part is held hostage. If you show them independently, the slow part may land first or push other content around when it arrives. Both hurt the two metrics users feel most: **LCP** (how soon the main content appears) and **CLS** (how much the page jumps).

## The rule

**Put a `<Suspense>` boundary around each part that loads on its own schedule, give it a fallback of the same size, and nest boundaries when order matters.**

### 1. One boundary per independent section

```tsx
// app/(app)/page.tsx
<Suspense fallback={<TrackListSkeleton rows={6} />}>
  <NewArrivals />     {/* cached: usually already in the shell */}
</Suspense>

<Suspense fallback={<TrackListSkeleton rows={4} />}>
  <FreshPicks />      {/* dynamic: streams in */}
</Suspense>
```

The sections are siblings, so their data loads **in parallel**. Each appears when ready.

### 2. Skeletons that match the real content

A fallback is a promise about layout. `TrackListSkeleton` uses the same grid, padding and row height as `TrackRow`, and the page passes the number of rows it expects. When the real rows arrive, nothing below them moves.

```tsx
// features/track/components/track-list.tsx
export function TrackListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="border-t border-rule">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[2.25rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-2 py-2.5">
          {/* same columns as <TrackRow> */}
        </div>
      ))}
    </div>
  );
}
```

`aria-hidden="true"` keeps the grey boxes out of the accessibility tree.

### 3. Nest when you do not know the size above

On the track page, the title can be one line or three. A separate skeleton for "More like this" could not know where to sit. So its boundary is nested inside the header's:

```tsx
// app/(app)/track/[id]/page.tsx
<Suspense fallback={<TrackHeaderSkeleton />}>
  <TrackHeader id={id} />
  <Suspense fallback={<TrackListSkeleton rows={5} />}>
    <MoreLikeThis id={id} />
  </Suspense>
</Suspense>
```

Both reads still start at the same time. The inner section just cannot be revealed before the outer one. The page settles from the top down, and nothing is pushed.

### Avoid waterfalls inside a boundary

Start independent reads together instead of one after another:

```tsx
// ✗ sequential: total time = a + b
const tracks = await getNewReleases(6);
const favoriteIds = await getFavoriteIds(userId);

// ✓ parallel: total time = max(a, b)
const [tracks, favoriteIds] = await Promise.all([getNewReleases(6), getFavoriteIds(userId)]);
```

## Try it

1. Run `npm run dev`. Open a track from the Library and watch the order: header first, then "More like this".
2. Open tracks with a short title ("Fuse Box") and a long one ("Arcade Closing Time"). The list below never jumps.
3. In `app/(app)/track/[id]/page.tsx`, move the inner `<Suspense>` out so it is a sibling of the header's. Reload a few times with the cache cold and watch the recommendations skeleton shift when the header arrives. Put it back.
4. In Chrome DevTools → Performance, record a page load and check the **Layout Shifts** track. It should be empty.

## Common mistakes

- **One boundary around the whole page.** Everything waits for the slowest part.
- **A boundary around every small element.** The page pops in piece by piece. Group things that belong together.
- **A spinner as the fallback.** It reserves no space, so content jumps when it loads.
- **Sequential awaits** in one component. Use `Promise.all`, or split into sibling components.
- **Putting the boundary inside the async component.** Suspense must be *above* the component that awaits.

Next: [Optimistic updates](./08-optimistic-updates.md)
