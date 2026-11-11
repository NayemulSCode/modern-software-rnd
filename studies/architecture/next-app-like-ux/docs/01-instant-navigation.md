# Instant navigation

## The problem

In a classic server-rendered app, clicking a link does nothing visible until the server has finished the whole next page. A slow query means a frozen screen. Single-page apps avoid this by drawing a loading state straight away, but they pay for it with large JavaScript bundles and data fetching in the browser.

## The rule

**A navigation is instant when the browser can paint the next page the moment the user clicks.** Not the finished page: the static parts, the cached parts and the loading placeholders. The server streams the rest into those placeholders.

Two config flags make this possible:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,    // every route gets a prerendered shell
  partialPrefetching: true, // that shell is fetched before the click
};
```

- `cacheComponents` guarantees each route has something to show immediately. If a component reads uncached data outside `<Suspense>`, the build fails.
- `partialPrefetching` downloads that shell for links on screen, so it is already in the browser when the click happens. It requires `cacheComponents`.

## The code in this repo

Every page follows one shape: **the page component is synchronous and returns `<Suspense>` boundaries immediately.**

```tsx
// app/(app)/track/[id]/page.tsx
export default function TrackPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<TrackHeaderSkeleton />}>
      <TrackContent params={params} />  {/* awaits params + data inside */}
    </Suspense>
  );
}
```

Notice that `params` is a promise and the page does **not** `await` it. The id in `/track/[id]` is only known at request time, so awaiting it at the top would make the whole page wait. The promise is passed down to a component inside the boundary.

### Why the layout's Suspense is not enough

On a client navigation, only the part of the tree below the shared layout re-renders. A `<Suspense>` in `app/(app)/layout.tsx` sits above that point, so it does not show its fallback when you move from one track to another. Each page needs its own boundary. This is the most common reason a navigation "blocks".

## Try it

Prefetching only runs in production, so use a production build to feel this:

```bash
npm run build
```

```bash
npm start
```

1. Open the Library and click any track. The skeleton or the header appears at once.
2. Stop the server, set `DEMO_DELAY_MS=3000` in `.env`, rebuild and try again. The click still responds immediately; only the dynamic section takes longer.
3. In development (`npm run dev`), open the Next.js DevTools, choose **Navigation Inspector** and turn on **Pause on navigations**. Click a link: the page freezes on its shell so you can see exactly what users get first.

## Common mistakes

- **`await params` or `await cookies()` at the top of a page.** Move the await into a child component inside `<Suspense>`.
- **A `loading.tsx` or boundary only in the root layout.** It covers the first page load but not navigations between sibling pages.
- **Judging speed in `next dev`.** Development compiles on demand and does not prefetch. Measure with `next build` and `next start`.
- **Forgetting `usePathname()`.** On routes with unknown params it also suspends. See `components/nav-link.tsx` for the fix.

Next: [Caching across navigations](./02-caching.md)
