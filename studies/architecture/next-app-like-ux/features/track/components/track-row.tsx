import type { ReactNode } from "react";
import { Cover } from "@/components/cover";
import type { TrackWithFavorite } from "@/features/track/types";
import { formatDuration } from "@/lib/format";
import { FavoriteButton } from "./favorite-button";
import { RowPlayButton } from "./play-button";
import { TrackLink } from "./track-link";

type TrackRowProps = {
  track: TrackWithFavorite;
  index: number;
  /** Extra controls at the end of the row (playlist reorder and remove buttons). */
  actions?: ReactNode;
};

/**
 * A Server Component with three small client islands inside it (the play
 * button, the title link and the heart). Everything else here is plain HTML
 * that ships no JavaScript at all.
 */
export function TrackRow({ track, index, actions }: TrackRowProps) {
  return (
    <div className="group grid grid-cols-[2.25rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-2 py-2.5 transition-colors hover:bg-card sm:grid-cols-[2.25rem_2.75rem_minmax(0,1fr)_6.5rem_3.5rem_3rem_auto]">
      <RowPlayButton track={track} index={index} />
      <Cover seed={track.seed} className="size-11" />

      <div className="min-w-0">
        <TrackLink
          trackId={track.id}
          className="block truncate font-medium decoration-signal decoration-2 underline-offset-4 hover:underline"
        >
          {track.title}
        </TrackLink>
        <p className="truncate text-sm text-ink-soft">{track.artist}</p>
      </div>

      <span className="eyebrow hidden sm:block">{track.genre}</span>
      <span className="hidden font-mono text-xs tabular-nums text-ink-soft sm:block">{track.bpm} bpm</span>
      <span className="hidden font-mono text-xs tabular-nums text-ink-soft sm:block">
        {formatDuration(track.durationSec)}
      </span>

      <div className="flex items-center justify-end">
        {actions}
        <FavoriteButton trackId={track.id} title={track.title} isFavorite={track.isFavorite} />
      </div>
    </div>
  );
}
