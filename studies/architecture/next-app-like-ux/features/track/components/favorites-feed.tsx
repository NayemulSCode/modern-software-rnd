import { ViewTransition } from "react";
import type { TrackWithFavorite } from "@/features/track/types";
import { QueueScope } from "./queue-scope";
import { TrackRow } from "./track-row";

/**
 * Lesson 11, pattern 2. Un-favouriting a track removes its row. Because the
 * update runs inside a transition and each row is a keyed <ViewTransition>,
 * the rows below slide up into the gap instead of jumping.
 */
export function FavoritesFeed({ tracks }: { tracks: TrackWithFavorite[] }) {
  return (
    <QueueScope queue={tracks}>
      <ol aria-label="Favorite tracks" className="border-t border-rule">
        {tracks.map((track, index) => (
          <ViewTransition key={track.id}>
            {/* `has-data-removing` matches while the heart inside this row is
                optimistically off: the row dims the moment you click. */}
            <li className="transition-opacity has-data-removing:opacity-40">
              <TrackRow track={track} index={index} />
            </li>
          </ViewTransition>
        ))}
      </ol>
    </QueueScope>
  );
}
