"use client";

import { createContext, type ReactNode, use, useEffect, useState, useSyncExternalStore } from "react";
import { initialSnapshot, type PlayerSnapshot, PlayerStore } from "./player-store";

const PlayerContext = createContext<PlayerStore | null>(null);

/**
 * Lesson 04. This provider is rendered in `app/(app)/layout.tsx`. Layouts stay
 * mounted while the page below them changes, so the music keeps playing as
 * you navigate. `children` are Server Components passed straight through —
 * putting a provider here does NOT turn the pages into Client Components.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  // One store per mounted app. Never a module-level singleton: on the server
  // that would be shared between every visitor's request.
  const [store] = useState(() => new PlayerStore());

  useEffect(() => store.dispose, [store]);

  return <PlayerContext value={store}>{children}</PlayerContext>;
}

function useStore(): PlayerStore {
  const store = use(PlayerContext);
  if (!store) throw new Error("usePlayer must be used inside <PlayerProvider>.");
  return store;
}

/**
 * Subscribe to one slice of playback state. Return a primitive or an existing
 * object reference from the selector — building a new object on every call
 * would make React think the value changed and re-render forever.
 */
export function usePlayer<T>(selector: (snapshot: PlayerSnapshot) => T): T {
  const store = useStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(initialSnapshot),
  );
}

/** Stable action functions. Calling these never causes a re-render by itself. */
export function usePlayerActions() {
  const store = useStore();
  return {
    play: store.play,
    toggle: store.toggle,
    next: store.next,
    previous: store.previous,
    seek: store.seek,
    setVolume: store.setVolume,
  };
}
