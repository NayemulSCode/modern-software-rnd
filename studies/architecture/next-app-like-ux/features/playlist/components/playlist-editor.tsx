"use client";

import clsx from "clsx";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ViewTransition } from "react";
import { Cover } from "@/components/cover";
import { QueueScope } from "@/features/track/components/queue-scope";
import { TrackRow } from "@/features/track/components/track-row";
import type { TrackWithFavorite } from "@/features/track/types";
import { applyPlaylistChanges, usePlaylistChanges } from "@/providers/playlist-changes-provider";

type PlaylistEditorProps = {
  playlistId: string;
  /** Confirmed by the server. Pending edits are replayed on top of these. */
  tracks: TrackWithFavorite[];
  suggestions: TrackWithFavorite[];
};

const iconButton =
  "grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-paper-deep hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent";

/**
 * Lessons 08, 09 and 11 in one place. Click the arrows quickly: each click
 * is drawn immediately (useOptimistic), saved in order (useActionState), and
 * the rows glide to their new positions (ViewTransition).
 */
export function PlaylistEditor({ playlistId, tracks, suggestions }: PlaylistEditorProps) {
  const { pendingChanges, mutate } = usePlaylistChanges();

  const visibleTracks = applyPlaylistChanges(tracks, pendingChanges, playlistId);
  const visibleIds = new Set(visibleTracks.map((track) => track.id));
  const visibleSuggestions = suggestions.filter((track) => !visibleIds.has(track.id));

  // Rows touched by a change that is still saving are dimmed slightly.
  const savingIds = new Set(
    pendingChanges
      .filter((change) => change.playlistId === playlistId)
      .map((change) => (change.type === "add" ? change.track.id : change.trackId)),
  );

  return (
    <div className="space-y-12">
      <section aria-labelledby="playlist-tracks-heading">
        <h2 id="playlist-tracks-heading" className="sr-only">
          Tracks
        </h2>

        {visibleTracks.length === 0 ? (
          <p className="border-y border-rule py-10 text-center font-display text-2xl italic text-ink-soft">
            Nothing here yet. Add something from below.
          </p>
        ) : (
          <QueueScope queue={visibleTracks}>
            <ol className="border-t border-rule">
              {visibleTracks.map((track, index) => (
                // The key is what lets React (and the browser) know this is
                // the same row in a new position, so it can animate the move.
                <ViewTransition key={track.id}>
                  <li className={clsx("transition-opacity", savingIds.has(track.id) && "opacity-60")}>
                    <TrackRow
                      track={track}
                      index={index}
                      actions={
                        <div className="mr-1 flex items-center">
                          <button
                            type="button"
                            className={iconButton}
                            disabled={index === 0}
                            aria-label={`Move ${track.title} up`}
                            onClick={() => mutate({ type: "move", playlistId, trackId: track.id, direction: "up" })}
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            className={iconButton}
                            disabled={index === visibleTracks.length - 1}
                            aria-label={`Move ${track.title} down`}
                            onClick={() => mutate({ type: "move", playlistId, trackId: track.id, direction: "down" })}
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            className={iconButton}
                            aria-label={`Remove ${track.title} from this playlist`}
                            onClick={() => mutate({ type: "remove", playlistId, trackId: track.id })}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      }
                    />
                  </li>
                </ViewTransition>
              ))}
            </ol>
          </QueueScope>
        )}
      </section>

      {visibleSuggestions.length > 0 ? (
        <ViewTransition>
          <section aria-labelledby="playlist-suggestions-heading">
            <h2 id="playlist-suggestions-heading" className="font-display text-3xl">
              Add something
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {visibleSuggestions.map((track) => (
                <ViewTransition key={track.id}>
                  <li className="flex items-center gap-3 rounded-[3px] border border-rule bg-card p-2 pr-3">
                    <Cover seed={track.seed} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{track.title}</p>
                      <p className="truncate text-sm text-ink-soft">{track.artist}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Add ${track.title} to this playlist`}
                      onClick={() => mutate({ type: "add", playlistId, track })}
                      className="grid size-8 place-items-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-paper"
                    >
                      <Plus className="size-4" />
                    </button>
                  </li>
                </ViewTransition>
              ))}
            </ul>
          </section>
        </ViewTransition>
      ) : null}
    </div>
  );
}
