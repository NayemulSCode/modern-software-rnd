# Fetching on the client

## The problem

Server Components are the default place to fetch data, but some data is only wanted in response to something the user does in the browser, changes while they watch, or is not worth a navigation. Search-as-you-type is the classic case: the query does not exist until the user types it.

Doing this by hand with `useEffect` and `fetch` means writing loading state, error state, request cancellation, caching and deduplication yourself, and usually getting one of them wrong.

## The rule

**Fetch on the server by default. Fetch on the client when the browser has to stay in charge, and use a data library when you do.**

| Fetch on the server when | Fetch on the client when |
|---|---|
| The data is needed for the first paint | It depends on input typed or chosen after load |
| It can be cached or prerendered | It must poll or update live while the page is open |
| It needs secrets or direct database access | It is on demand: a search box, a hover card, "load more" |

## The code in this repo

### 1. A small JSON endpoint

```ts
// app/api/search/route.ts
const querySchema = z.string().trim().min(2).max(60);

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!parsed.success) {
    return Response.json({ error: "Search needs between 2 and 60 characters." }, { status: 400 });
  }

  try {
    const tracks = await searchTracks(parsed.data);
    return Response.json({ tracks } satisfies SearchResponse);
  } catch (error) {
    console.error("Search failed", error);
    return Response.json({ error: "Search is unavailable right now." }, { status: 500 });
  }
}
```

### 2. A fetcher that treats HTTP errors as errors

`fetch` only rejects when the network fails. A 500 response resolves normally, so without this check SWR would hand an error body to your component as if it were data.

```ts
// lib/fetch-json.ts
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
```

### 3. A hook that owns the key and the options

```ts
// features/search/use-search.ts
export function useSearch(query: string) {
  const term = query.trim();
  const key = term.length >= MIN_QUERY_LENGTH ? `/api/search?q=${encodeURIComponent(term)}` : null;

  return useSWR<SearchResponse, Error>(key, fetchJson, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
}
```

- A `null` key means "do not fetch".
- The key is also the cache key. Type "glass", delete it, type it again: the second time is served from memory.
- `keepPreviousData` keeps the last results on screen while the next ones load, so the list does not flash empty on every keystroke.

### 4. A component that handles every state

`features/search/components/command-palette.tsx` renders four distinct states: too short, loading, error and empty. It uses `useDeferredValue` so typing stays smooth and fewer requests are sent, and a native `<dialog>` for focus trapping and Escape.

## When the first view needs the data too

For a chat or a live feed you want both: server-rendered first paint, then client polling. Start the request on the server and hand it to the client cache, so the browser does not fetch it a second time:

```tsx
// Server Component
export async function MessageThread({ channelId }: { channelId: string }) {
  const messages = await getMessages(channelId);
  return (
    <SWRConfig value={{ fallback: { [`/api/messages/${channelId}`]: messages } }}>
      <MessageList channelId={channelId} />
    </SWRConfig>
  );
}

// Client Component
export function useMessages(channelId: string) {
  return useSWR(`/api/messages/${channelId}`, fetchJson, { refreshInterval: 10_000 });
}
```

Tempo does not need this, so it is not in the code. It is the pattern to reach for when you do. TanStack Query has the same idea with `HydrationBoundary`.

## Try it

1. Press **Ctrl+K** (or click the search box). Type `ni`.
2. Watch the Network tab: requests go to `/api/search?q=…`.
3. Clear the box and type `ni` again. No new request: SWR answers from its cache.
4. Type `zzzz`. You get the empty state, not a blank panel.
5. Use the arrow keys and Enter to open a result without touching the mouse.

## Common mistakes

- **`useEffect` + `fetch` + `useState`.** No caching, no deduplication, and a race condition when responses arrive out of order.
- **Fetching in the browser what the server could have rendered.** That creates a waterfall: HTML, then JavaScript, then data.
- **Not checking `response.ok`.**
- **No validation on the endpoint.** A Route Handler is public, just like a Server Action.
- **A request per keystroke with no deferral or minimum length.**

Next: [View Transitions](./11-view-transitions.md)
