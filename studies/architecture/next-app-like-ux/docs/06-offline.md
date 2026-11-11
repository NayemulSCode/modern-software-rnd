# Handling connection drops

> **Experimental.** `experimental.useOffline` may change and is not recommended for production yet. It is included here because the idea behind it is worth learning.

## The problem

On a train or a weak mobile connection, the network disappears for a few seconds at a time. In most web apps a click during that gap produces an error page or a spinner that never ends. A native app would simply wait and carry on.

## The rule

**A short connection loss should pause the app, not break it.** Keep what is already on screen, tell the user what is happening, and finish their action when the connection returns.

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    useOffline: true,
  },
};
```

With the flag on, Next.js:

- detects loss of connection from the browser's `offline` event and from failed requests;
- keeps a failed navigation, prefetch or Server Action **pending** instead of throwing;
- checks for the connection with small `HEAD` requests (after 0.5s, 1s, 2s, then every 3s);
- retries the pending requests once when the connection is back.

## The code in this repo

The framework does the waiting. The app only has to explain it:

```tsx
// components/offline-bar.tsx
"use client";

import { useOffline } from "next/offline";

export function OfflineBar() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div role="status" className="…">
      You are offline. Reconnecting — anything you clicked will finish when the connection returns.
    </div>
  );
}
```

`role="status"` makes screen readers announce the message without interrupting the user.

### Why the earlier lessons matter here

Because App Shells were prefetched (lesson 03), a navigation while offline can still render the destination's shell: headings, layout, skeletons, and any cached data that was part of the prefetch. Only the dynamic holes wait. And music keeps playing, because the audio is generated in the browser by a provider that never unmounts (lesson 04).

## Try it

Use a production build so prefetching is active:

```bash
npm run build
```

```bash
npm start
```

1. Open the Library and let it load. Start a track.
2. In DevTools → Network, switch throttling to **Offline**.
3. Click a track you hovered earlier, then a playlist. The yellow bar appears. Pages you prefetched still show their shell; the rest stays as a skeleton.
4. Click a heart. It changes immediately (lesson 08) and the save waits.
5. Switch back to **No throttling**. The bar disappears, the skeletons fill in and the favorite is saved.

## Common mistakes

- **Treating this as full offline support.** It handles temporary drops during a session. It does not make the app load with no connection; that needs a service worker.
- **Relying on `navigator.onLine` alone.** It reports `true` on a Wi-Fi network with no internet. `useOffline` also reacts to requests that actually fail.
- **No message at all.** Silent waiting looks like a frozen app. Always say that you are reconnecting.
- **Applying it to your own `fetch` calls.** The retry covers framework requests. For SWR requests (lesson 10), SWR has its own `revalidateOnReconnect`.

Next: [Streaming with Suspense](./07-streaming.md)
