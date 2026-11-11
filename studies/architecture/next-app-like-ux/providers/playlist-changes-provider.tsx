"use client";

import { createContext, type ReactNode, startTransition, use, useActionState, useOptimistic } from "react";
import { toast } from "sonner";
import { savePlaylistChange } from "@/features/playlist/playlist-actions";
import type { PlaylistChange, PlaylistChangePayload } from "@/features/playlist/types";
import type { TrackWithFavorite } from "@/features/track/types";

type PlaylistChangesContextValue = {
  /** Changes that have been drawn on screen but not yet confirmed by the server. */
  pendingChanges: PlaylistChange[];
  mutate: (change: PlaylistChange) => void;
};

const PlaylistChangesContext = createContext<PlaylistChangesContextValue | null>(null);

function toPayload(change: PlaylistChange): PlaylistChangePayload {
  if (change.type === "add") {
    return { type: "add", playlistId: change.playlistId, trackId: change.track.id };
  }
  return change;
}

/**
 * Lesson 09. Two React hooks do two different jobs here:
 *
 * - `useActionState` is the queue. Each `dispatch` waits for the previous
 *   one to finish, so three quick reorders are saved in the order you made
 *   them instead of racing each other.
 * - `useOptimistic` is the screen. It holds the not-yet-saved changes so the
 *   UI can show them immediately. When the transition ends React drops this
 *   list — by then the server data has either caught up or the change failed.
 */
export function PlaylistChangesProvider({ children }: { children: ReactNode }) {
  const [, dispatch] = useActionState(async (_previous: null, change: PlaylistChange) => {
    try {
      const result = await savePlaylistChange(toPayload(change));
      if (result.ok) {
        if (change.type !== "move") toast.success(result.data.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      // Reached only if the request itself failed (server down, not offline —
      // offline requests wait and retry, see lesson 06).
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
    // Both calls must be inside the same transition: that is what ties the
    // optimistic value's lifetime to the Server Action.
    startTransition(() => {
      addOptimisticChange(change);
      dispatch(change);
    });
  }

  return <PlaylistChangesContext value={{ pendingChanges, mutate }}>{children}</PlaylistChangesContext>;
}

export function usePlaylistChanges(): PlaylistChangesContextValue {
  const value = use(PlaylistChangesContext);
  if (!value) throw new Error("usePlaylistChanges must be used inside <PlaylistChangesProvider>.");
  return value;
}

/** Replays pending changes for one playlist on top of the tracks the server sent. */
export function applyPlaylistChanges(
  tracks: TrackWithFavorite[],
  changes: PlaylistChange[],
  playlistId: string,
): TrackWithFavorite[] {
  let result = tracks;

  for (const change of changes) {
    if (change.playlistId !== playlistId) continue;

    if (change.type === "add") {
      if (!result.some((track) => track.id === change.track.id)) result = [...result, change.track];
    } else if (change.type === "remove") {
      result = result.filter((track) => track.id !== change.trackId);
    } else {
      const from = result.findIndex((track) => track.id === change.trackId);
      const to = change.direction === "up" ? from - 1 : from + 1;
      if (from === -1 || to < 0 || to >= result.length) continue;
      result = [...result];
      [result[from], result[to]] = [result[to], result[from]];
    }
  }

  return result;
}
