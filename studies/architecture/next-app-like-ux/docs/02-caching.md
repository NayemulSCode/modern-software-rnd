# Caching across navigations

## The problem

A skeleton makes the first visit feel responsive. But if the user goes Home → Library → Home, showing the same skeleton again for data that has not changed is wasted time, and it makes the app feel like a website instead of an app.

## The rule

**If a read does not need to be fresh on every request, mark it with `'use cache'`.** Then decide two things: how long it may live, and what name a mutation can use to expire it.

```ts
// features/track/track-queries.ts
export async function getTrack(id: string): Promise<Track | null> {
  "use cache";                                    // 1. cache the return value
  cacheLife("hours");                             // 2. how long it stays fresh
  cacheTag(trackTags.all, trackTags.one(id));     // 3. names for invalidation

  await simulateLatency();
  return prisma.track.findUnique({ where: { id }, select: trackSelect });
}
```

### Three things to know

**1. The arguments are the cache key.** `getTrack("glass-harbor")` and `getTrack("warm-brick")` are separate entries. This is why every per-user query in this repo takes `userId` as an argument: it keeps one user's data out of another user's cache entry.

```ts
export async function getFavoriteIds(userId: string): Promise<string[]> {
  "use cache";
  cacheTag(trackTags.favorites(userId)); // "user-favorites-demo-user"
  // …
}
```

**2. `cacheLife` takes a named profile.** The built-in ones:

| Profile | Revalidates after | Expires after | Use for |
|---|---|---|---|
| `seconds` | 1 second | 1 minute | Near real-time data |
| `minutes` | 1 minute | 1 hour | Frequently updated content |
| `hours` | 1 hour | 1 day | Updated a few times a day |
| `days` | 1 day | 1 week | Updated daily |
| `max` | 30 days | 1 year | Almost never changes |

Tempo uses `hours` for the catalog, `minutes` for favorites and `max` for these lesson pages.

**3. There are two caches.** The server keeps the function result. The browser also keeps the payload of routes it has prefetched or visited. While that payload is fresh, coming back to a page needs no server request at all.

### What cannot be cached

A `'use cache'` function cannot read `cookies()`, `headers()` or `searchParams` directly, because those belong to one request. Read them outside and pass the values in as arguments.

## The code in this repo

- `features/track/track-queries.ts` and `features/playlist/playlist-queries.ts`: every cached read, with tags defined once in a `trackTags` / `playlistTags` object so reads and mutations cannot disagree on a name.
- `features/learn/render-lesson.ts`: caches the Markdown-to-HTML conversion for this page.
- The uncached functions (`getRecommendations`, `getFreshPicks`) call `connection()` first. That tells Next.js "this needs a real request", which keeps them out of the prerendered shell.

## Try it

1. Run `npm run dev` and open the Library. The first load shows a skeleton for about a second (`DEMO_DELAY_MS`).
2. Go Home, then back to the Library. No skeleton: the list is served from cache.
3. On Home, compare "New arrivals" (cached) with "Shuffled just now" (dynamic). Refresh a few times. Only the second one changes and only the second one shows a skeleton.

## Common mistakes

- **Leaving an id out of the arguments.** If a cached function reads a user id from a closure or a global instead of a parameter, two users can share an entry.
- **Caching without a tag.** You will have no way to expire the entry after a write except waiting for it to time out.
- **Caching everything.** Truly per-request data (a shuffle, a live count, anything from `cookies()`) should stay dynamic and stream.
- **Returning non-serializable values.** The result is stored and sent over the network: plain objects, arrays, strings and numbers only. Return an array, not a `Set`.

Next: [Prefetching](./03-prefetching.md)
