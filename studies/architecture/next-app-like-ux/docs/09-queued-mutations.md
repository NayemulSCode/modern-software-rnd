# Queued mutations

## The problem

One optimistic toggle is simple. Now the user moves a track up three times in two seconds. Three requests are in the air at once. They can arrive at the server in a different order, and each response re-renders the list while the others are still pending. The list jumps around and may end in the wrong order.

## The rule

**When edits can overlap, save them one at a time in the order they were made, and keep every unsaved edit on screen until the server has caught up.**

Two hooks, two jobs:

| Hook | Job |
|---|---|
| `useActionState` | **The queue.** Each dispatched action waits for the previous one to finish. |
| `useOptimistic` | **The screen.** Holds the list of edits that are drawn but not yet confirmed. |

## The code in this repo

### An edit is a small object

```ts
// features/playlist/types.ts
export type PlaylistChange =
  | { type: "add"; playlistId: string; track: TrackWithFavorite }
  | { type: "remove"; playlistId: string; trackId: string }
  | { type: "move"; playlistId: string; trackId: string; direction: "up" | "down" };
```

### The provider queues and remembers them

```tsx
// providers/playlist-changes-provider.tsx
"use client";

export function PlaylistChangesProvider({ children }: { children: ReactNode }) {
  const [, dispatch] = useActionState(async (_previous: null, change: PlaylistChange) => {
    try {
      const result = await savePlaylistChange(toPayload(change));
      if (!result.ok) toast.error(result.error);
    } catch (error) {
      console.error("savePlaylistChange request failed", error);
      toast.error("Something went wrong. Your change was not saved.");
    }
    return null;
  }, null);

  const [pendingChanges, addOptimisticChange] = useOptimistic<PlaylistChange[], PlaylistChange>(
    [],
    (changes, change) => [...changes, change],
  );

  function mutate(change: PlaylistChange) {
    startTransition(() => {
      addOptimisticChange(change); // draw it
      dispatch(change);            // queue it
    });
  }

  return <PlaylistChangesContext value={{ pendingChanges, mutate }}>{children}</PlaylistChangesContext>;
}
```

### The list replays pending edits over server data

```tsx
// features/playlist/components/playlist-editor.tsx
const { pendingChanges, mutate } = usePlaylistChanges();
const visibleTracks = applyPlaylistChanges(tracks, pendingChanges, playlistId);
```

`tracks` is what the server last confirmed. `applyPlaylistChanges` is a pure function that applies each pending edit in order. What you see is always *server truth + your unsaved edits*. When the queue empties, `pendingChanges` is `[]` again and the server data already contains everything.

### Composition: server data, client interaction

The playlist page is a Server Component. It fetches the playlist, checks it exists, and hands plain data to one Client Component:

```tsx
// app/(app)/playlist/[id]/page.tsx
<PlaylistEditor playlistId={playlist.id} tracks={tracks} suggestions={suggestions} />
```

The provider lives in the layout, so the "In your playlists" chips on a track page share the same queue.

## Try it

1. Set `DEMO_DELAY_MS=2000` in `.env` and restart `npm run dev`.
2. Open **Desk Hours**. Click the down arrow on the first track four times quickly.
3. The row moves on every click. In the Network tab the four requests run one after another, not together.
4. Add two tracks from "Add something" and remove one before the first save finishes. Everything stays where you put it and the final order is correct.
5. Reload the page. The order you ended with is what the database has.

## Common mistakes

- **Firing overlapping actions with plain `startTransition`.** They run in parallel and may finish out of order.
- **Storing the optimistic list in `useState`.** You must then remove entries yourself on success and on failure, and it is easy to leave ghosts behind. `useOptimistic` clears itself.
- **Sending client objects to the server.** `toPayload` strips the change down to ids. The server looks everything else up itself.
- **Non-atomic writes.** A reorder updates many rows. `savePlaylistChange` does it in one `prisma.$transaction`, so a failure cannot leave the playlist half sorted.

Next: [Fetching on the client](./10-client-fetching.md)
