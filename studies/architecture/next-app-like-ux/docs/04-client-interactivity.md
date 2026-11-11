# Client interactivity

## The problem

A music player has state that must survive navigation: what is playing, the queue, the position. Buttons all over the app need to read and change it. The easy answer is to make the whole app a Client Component, which throws away server rendering and ships far more JavaScript.

## The rule

**Keep `'use client'` at the leaves, and put shared state in a provider inside a layout.**

Two facts make this work:

1. **Layouts do not re-render on navigation.** A provider in a layout stays mounted, so its state survives every page change below it.
2. **A Client Component can render Server Components passed as `children`.** The provider is client code; the pages it wraps are not.

```tsx
// app/(app)/layout.tsx — a Server Component
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <PlayerProvider>          {/* client: holds playback state */}
      <Sidebar />             {/* server */}
      <main>{children}</main> {/* server: the pages */}
      <NowPlayingBar />       {/* client: reads the state */}
    </PlayerProvider>
  );
}
```

## The code in this repo

### The provider and its hook

```tsx
// providers/player-provider.tsx
"use client";

export function PlayerProvider({ children }: { children: ReactNode }) {
  // One store per mounted app, created once.
  const [store] = useState(() => new PlayerStore());
  useEffect(() => store.dispose, [store]);
  return <PlayerContext value={store}>{children}</PlayerContext>;
}

export function usePlayer<T>(selector: (snapshot: PlayerSnapshot) => T): T {
  const store = useStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(initialSnapshot),
  );
}
```

### Subscribing to a slice, not the whole state

The playback position updates four times a second. If it lived in a plain context value, every play button in a 36-row list would re-render four times a second. Instead each component selects only what it needs:

```tsx
// features/track/components/play-button.tsx
const isCurrent = usePlayer((s) => s.current?.id === track.id); // boolean
const isPlaying = usePlayer((s) => s.isPlaying);                // boolean

// components/now-playing-bar.tsx — the only subscriber to position
const position = usePlayer((s) => s.position);
```

A row re-renders only when its own answer changes from `false` to `true` or back.

### A second, smaller provider

`QueueScope` wraps each list so a play button knows which tracks come next, without passing the whole list to every row as a prop:

```tsx
// features/track/components/track-list.tsx (Server Component)
<QueueScope queue={tracks}>
  <ol>{tracks.map((track, i) => <li key={track.id}><TrackRow track={track} index={i} /></li>)}</ol>
</QueueScope>
```

## Try it

1. Press play on any track.
2. Navigate: Library, a playlist, this guide. The music does not stop and the bar at the bottom stays in sync.
3. Open React DevTools → Profiler, record while a track plays, and look at what re-renders. It should be the progress slider only.
4. Refresh the page. Playback stops, because a full reload remounts the layout. That is the difference between a navigation and a reload.

## Common mistakes

- **`'use client'` in a layout or page file** to use one hook. Move the hook into a small component instead.
- **A module-level singleton for state** (`export const store = new Store()`). On the server that object is shared by every visitor. Create it inside the provider.
- **Reading browser APIs during render** (`window`, `localStorage`, `new AudioContext()`). Client Components also render on the server for the first HTML. Use an effect or an event handler. The audio context here is created on the first click.
- **Returning a new object from a selector** (`usePlayer((s) => ({ a: s.a }))`). It is a different object every time, so React re-renders forever. Return primitives or existing references.

Next: [Revalidating after mutations](./05-revalidation.md)
