# Optimistic updates

## The problem

The user clicks a heart. The honest sequence is: send request, wait, get answer, update the screen. On a slow connection that is a full second in which nothing happens, so the user clicks again. A spinner on the button is better, but it still tells the user to wait for something that almost always succeeds.

## The rule

**Show the result you expect immediately. Let the server confirm it. If the server says no, go back and say why.**

React has two hooks for this, and they work as a pair:

- `useTransition` groups the Server Action and the re-render that follows it into one pending operation.
- `useOptimistic` holds a temporary value that exists only while that operation is running.

## The code in this repo

```tsx
// features/track/components/favorite-button.tsx
"use client";

export function FavoriteButton({ trackId, title, isFavorite }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite);     // 1. draw it now
      try {
        const result = await toggleFavorite(trackId); // 2. ask the server
        if (!result.ok) toast.error(result.error);    // 3. explain a rejection
      } catch (error) {
        console.error("toggleFavorite request failed", error);
        toast.error("Could not reach the server. Your change was undone.");
      }
    });
  }

  return (
    <button type="button" aria-pressed={optimisticFavorite} onClick={handleToggle}>
      <Heart fill={optimisticFavorite ? "currentColor" : "none"} />
    </button>
  );
}
```

### How the rollback works

There is no rollback code. That is the point.

- `isFavorite` is a prop from the server: the last **confirmed** value.
- `optimisticFavorite` equals `isFavorite`, except while the transition is running.
- **Success:** the action calls `updateTag`, the server re-renders, a new `isFavorite` arrives, the transition ends. The optimistic value and the real value now agree.
- **Failure:** nothing was written, so `isFavorite` never changes. The transition ends and React shows `isFavorite` again. The heart flips back by itself.

### See a rejection on purpose

The "Staff Picks" playlist is marked `locked` in the database. The UI lets you edit it anyway, so you can watch the full cycle: the row disappears, the server refuses, a toast explains, the row returns.

```ts
// features/playlist/playlist-actions.ts
if (playlist.locked) return fail(`“${playlist.name}” is locked, so the change was undone.`);
```

## Try it

1. Set `DEMO_DELAY_MS=2500` in `.env` and restart `npm run dev`, so the gap is easy to see.
2. Click a heart. It fills at once, long before the request finishes (watch the Network tab).
3. Open **Staff Picks** from the sidebar and remove a track. It vanishes, then comes back with an error toast.
4. On a track page, click the **Staff Picks** chip under "In your playlists". Same cycle.

## Common mistakes

- **Calling `setOptimistic…` outside a transition.** React warns and the value is dropped at once. It must be inside `startTransition` or a form action.
- **Calling the action outside the transition.** The optimistic value's lifetime is no longer tied to the request, so it flickers back early.
- **Being optimistic about things that often fail** or cannot be undone: payments, sending a message to someone else. Use a pending state there.
- **No feedback on failure.** A silent rollback looks like the click did not work. Always say what happened.
- **Forgetting accessibility.** `aria-pressed` must reflect the optimistic value so screen-reader users get the same instant feedback.

Next: [Queued mutations](./09-queued-mutations.md)
