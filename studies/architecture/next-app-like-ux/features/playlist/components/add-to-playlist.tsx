"use client";

import clsx from "clsx";
import { Check, Lock, Plus } from "lucide-react";
import type { PlaylistSummary } from "@/features/playlist/types";
import type { TrackWithFavorite } from "@/features/track/types";
import { usePlaylistChanges } from "@/providers/playlist-changes-provider";

type AddToPlaylistProps = {
  track: TrackWithFavorite;
  playlists: PlaylistSummary[];
  /** Playlists that already contain this track, as confirmed by the server. */
  memberIds: string[];
};

/**
 * One toggle per playlist. Uses the same queue as the playlist page (lesson
 * 09), so you can click several chips in a row without waiting for each save.
 */
export function AddToPlaylist({ track, playlists, memberIds }: AddToPlaylistProps) {
  const { pendingChanges, mutate } = usePlaylistChanges();

  // Start from what the server said, then replay unsaved changes on top.
  const members = new Set(memberIds);
  const saving = new Set<string>();
  for (const change of pendingChanges) {
    if (change.type === "add" && change.track.id === track.id) {
      members.add(change.playlistId);
      saving.add(change.playlistId);
    }
    if (change.type === "remove" && change.trackId === track.id) {
      members.delete(change.playlistId);
      saving.add(change.playlistId);
    }
  }

  function toggle(playlistId: string) {
    if (members.has(playlistId)) {
      mutate({ type: "remove", playlistId, trackId: track.id });
    } else {
      mutate({ type: "add", playlistId, track });
    }
  }

  return (
    <div role="group" aria-label="Playlists containing this track" className="flex flex-wrap gap-2">
      {playlists.map((playlist) => {
        const isMember = members.has(playlist.id);
        return (
          <button
            key={playlist.id}
            type="button"
            aria-pressed={isMember}
            onClick={() => toggle(playlist.id)}
            className={clsx(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
              isMember ? "border-ink bg-ink text-paper" : "border-rule bg-card hover:border-ink",
              saving.has(playlist.id) && "opacity-70",
            )}
          >
            {playlist.locked ? (
              <Lock className="size-3.5" aria-hidden="true" />
            ) : isMember ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
            ) : (
              <Plus className="size-3.5" aria-hidden="true" />
            )}
            {playlist.name}
            {playlist.locked ? <span className="sr-only">(locked)</span> : null}
          </button>
        );
      })}
    </div>
  );
}
