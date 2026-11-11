# Revalidating after mutations

## The problem

Caching makes reads fast, and it creates a new problem. The user favorites a track on Home, opens Favorites, and the track is missing because that page is still showing its cached copy. Stale data after your own action feels like a bug.

## The rule

**After a write, expire the tag of every cached read that shows the changed data.**

1. Reads name themselves with `cacheTag(...)`.
2. The Server Action does the write, then calls `updateTag(...)` with the same names.

```ts
// features/track/track-actions.ts
"use server";

export async function toggleFavorite(trackId: string): Promise<ActionResult<{ isFavorite: boolean }>> {
  const parsed = trackIdSchema.safeParse(trackId);
  if (!parsed.success) return fail("That track could not be found.");

  const userId = await getCurrentUserId();

  try {
    // …create or delete the favorite…
    updateTag(trackTags.favorites(userId));
    return ok({ isFavorite: !existing });
  } catch (error) {
    console.error("toggleFavorite failed", error);
    return fail("Could not update your favorites. Please try again.");
  }
}
```

That single `updateTag` call refreshes the heart on every track row (which reads `getFavoriteIds`) and the Favorites page (which reads `getFavoriteTracks`), because both reads carry the same tag.

### `updateTag` or `revalidateTag`?

| | `updateTag(tag)` | `revalidateTag(tag, profile)` |
|---|---|---|
| Where | Server Actions only | Server Actions and Route Handlers |
| Next read | Waits for fresh data | May serve the old value while refreshing in the background |
| Use for | The user's own change, which they expect to see now | Background updates, webhooks, content other people changed |

### Think about where the data appears

The number of tags to expire depends on how many views show the data. Changing a playlist affects two things:

```ts
// features/playlist/playlist-actions.ts
updateTag(playlistTags.one(change.playlistId));          // the playlist page
if (change.type !== "move") updateTag(playlistTags.all); // sidebar counts, "in your playlists" chips
```

A reorder does not change any count, so it skips the second tag. Expire what changed, not everything.

## Server Actions are public endpoints

`'use server'` turns a function into an HTTP endpoint that anyone can call with any arguments. Every action in this repo therefore:

- **validates input** with zod before using it;
- **finds the user itself** (`getCurrentUserId()`), never from an argument;
- **checks permission against the database** (is this playlist yours? is it locked?);
- **returns** `{ ok: true, data }` or `{ ok: false, error }` instead of throwing, so the UI can show a precise message (`lib/result.ts`).

## Try it

1. On Home, click the heart on a track that is not a favorite.
2. Open Favorites. The track is there, with no manual refresh.
3. Go to the Library. The same track's heart is filled there too.
4. Open a track page and toggle a playlist chip under "In your playlists". Watch the track count next to that playlist in the sidebar change.

## Common mistakes

- **Mutating without expiring anything.** The write succeeds and the UI keeps showing old data until the cache times out.
- **Expiring one view and forgetting another.** List every place the data is shown. Keeping tag names in one object (`trackTags`, `playlistTags`) makes this easier to check.
- **Calling `updateTag` before the write finishes.** A read could refill the cache with the old value. Write first, then expire.
- **Trusting the client.** Never accept `userId`, a price or a role as an action argument.
- **`revalidatePath("/")` for everything.** It works, but it throws away far more cache than needed. Tags are precise.

Next: [Handling connection drops](./06-offline.md)
