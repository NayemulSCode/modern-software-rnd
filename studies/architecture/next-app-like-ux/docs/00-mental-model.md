# The mental model

Almost every decision in a Next.js app comes down to two questions. Ask them about each piece of UI, not about each page.

## Question 1: where does this code run?

| | Server Component (default) | Client Component (`'use client'`) |
|---|---|---|
| Runs | On the server only | On the server for the first HTML, then in the browser |
| Can | Read the database, use secrets, `await` data | Use state, effects, event handlers, browser APIs |
| Cannot | Use `useState`, `onClick`, `window` | Read the database or secrets |
| JavaScript sent to the browser | None | Its own code and everything it imports |

**The rule:** start on the server. Add `'use client'` to the smallest component that needs interaction.

In this repo, a track row is a Server Component. Only three small parts inside it are client code:

```tsx
// features/track/components/track-row.tsx  (no 'use client')
export function TrackRow({ track, index }: TrackRowProps) {
  return (
    <div>
      <RowPlayButton track={track} index={index} />   {/* client */}
      <Cover seed={track.seed} />                     {/* server, zero JS */}
      <TrackLink trackId={track.id}>{track.title}</TrackLink> {/* client */}
      <p>{track.artist}</p>                           {/* server, zero JS */}
      <FavoriteButton trackId={track.id} isFavorite={track.isFavorite} /> {/* client */}
    </div>
  );
}
```

## Question 2: when is this data known?

With `cacheComponents: true`, every piece of output is one of three kinds:

| Kind | Known when | How you write it | Example in Tempo |
|---|---|---|---|
| **Static** | At build time | Plain JSX, no data | Page headings, the sidebar links |
| **Cached** | At build time or on first request, then reused | A function with `'use cache'` | The library, a track's details, playlists |
| **Dynamic** | Only during a request | Uncached read inside `<Suspense>` | "Shuffled just now", "More like this" |

Static and cached output together form the **shell**: HTML that can be sent, and prefetched, before any request-time work happens. Dynamic output streams into the holes that `<Suspense>` leaves in that shell.

```tsx
// app/(app)/page.tsx — the whole idea in one file
export default function HomePage() {
  return (
    <>
      <PageHeader title="…" />                          {/* static */}
      <Suspense fallback={<PlaylistShelfSkeleton />}>
        <PlaylistShelf />                                {/* cached */}
      </Suspense>
      <Suspense fallback={<TrackListSkeleton rows={4} />}>
        <FreshPicks />                                   {/* dynamic */}
      </Suspense>
    </>
  );
}
```

## How the two questions combine

- Server + static or cached: the fastest thing you can ship. Aim to make most of the page this.
- Server + dynamic: correct, fresh, and must be wrapped in `<Suspense>`.
- Client: for interaction. Give it its initial data as props from a Server Component.

## Try it

1. Run `npm run build`. Read the route table at the end. `○` means fully static, `◐` means a static shell with dynamic holes, `ƒ` means rendered on every request.
2. Open `app/(app)/page.tsx` and delete the `<Suspense>` around `<FreshPicks />`. Run `npm run build` again. The build stops with a `blocking-prerender-dynamic` error for the `/` route. That error is the framework protecting your users from a blank page. Put the boundary back.

## Common mistakes

- **Putting `'use client'` at the top of a page.** Everything it imports becomes browser JavaScript, and the page can no longer fetch data directly.
- **Thinking in pages.** One page usually mixes all three kinds of data. Decide per component.
- **Passing non-serializable props** from server to client: functions, class instances, `Date` objects from an ORM. Convert to plain objects first (see `features/track/types.ts`).

Next: [Instant navigation](./01-instant-navigation.md)
