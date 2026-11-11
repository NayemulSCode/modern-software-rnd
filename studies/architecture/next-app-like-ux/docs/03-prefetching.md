# Prefetching

## The problem

Even a fast server is a network round trip away. If the browser only starts fetching after the click, the user always waits for at least that round trip.

## The rule

**Fetch what the next page needs before the user asks for it, and be deliberate about how much.**

With `partialPrefetching: true` there are two levels:

| | `<Link>` (default, `"auto"`) | `<Link prefetch={true}>` |
|---|---|---|
| What is fetched | The route's **App Shell**: static UI and fallbacks | The shell **plus** cached content for this exact URL |
| Requests | One per route, shared by every link to it | One per link |
| Server work | None if the shell is already prerendered | Can invoke the server as the link becomes visible |
| After the click | Skeleton, then content | Content already there |

So the 36 track links in the Library share one App Shell by default. With `prefetch={true}` on all of them, each link would make its own request as it scrolled into view.

## The code in this repo

### A few important links: `prefetch={true}`

The previous/next links on a track page are few, and the user is likely to click them:

```tsx
// app/(app)/track/[id]/page.tsx
<Link href={`/track/${neighbors.next.id}`} prefetch={true} transitionTypes={["nav-forward"]}>
  {neighbors.next.title}
</Link>
```

### A long list: upgrade on intent

For track rows, `TrackLink` starts with the cheap default and switches to `true` only when the user hovers, focuses or touches the link:

```tsx
// features/track/components/track-link.tsx
"use client";

export function TrackLink({ trackId, className, children }: TrackLinkProps) {
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
```

The time between hovering and clicking is usually a few hundred milliseconds, which is often enough for the track's cached header to arrive.

### Playlist links: the default

Sidebar playlist links use plain `<Link>`. Clicking one shows the playlist skeleton first, then the content. Compare that with a track link to see the difference.

### `prefetch={true}` only helps cached content

Prefetching can include a read only if that read is marked `'use cache'`. The track header is cached, so it is prefetched. "More like this" is dynamic, so it always streams after navigation.

## Try it

Prefetching runs in production only:

```bash
npm run build
```

```bash
npm start
```

1. Open DevTools → Network and filter by `_rsc`. Open the Library and let it settle. A handful of prefetch requests go out, far fewer than the 36 rows.
2. Hover a track title, for example "Fuse Box". A new request for `/track/fuse-box` appears: that is the upgrade to `prefetch={true}`.
3. Click it. The header is there almost immediately, and only "More like this" shows a skeleton.
4. Click a playlist in the sidebar instead. You get the skeleton first, because only its shell was prefetched.

Measured on this app's production build with the default 900ms demo delay: the track heading was on screen about 120ms after the click, and the dynamic section arrived about 2 seconds after it.

## Common mistakes

- **`prefetch={true}` on every link in a feed.** Each one can hit your server as it scrolls into view. Use it where the content being ready is worth a request.
- **`prefetch={false}` to "save bandwidth".** That also removes the shared App Shell, so the click has nothing to show. Prefer the default.
- **Expecting dynamic content to be prefetched.** Only static and cached output can be.
- **Using `<a href>` or `router.push` for internal links.** A plain `<a>` reloads the whole page; `router.push` does not prefetch. Use `<Link>`.

Next: [Client interactivity](./04-client-interactivity.md)
