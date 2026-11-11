import type { TrackWithFavorite } from "@/features/track/types";
import { QueueScope } from "./queue-scope";
import { TrackRow } from "./track-row";

export function TrackList({ tracks, label }: { tracks: TrackWithFavorite[]; label: string }) {
  return (
    <QueueScope queue={tracks}>
      <ol aria-label={label} className="border-t border-rule">
        {tracks.map((track, index) => (
          <li key={track.id}>
            <TrackRow track={track} index={index} />
          </li>
        ))}
      </ol>
    </QueueScope>
  );
}

export function TrackListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="border-t border-rule">
      {Array.from({ length: rows }, (_, i) => (
        // Same grid, padding and heights as <TrackRow>, so nothing moves when
        // the real rows replace these.
        <div key={i} className="grid grid-cols-[2.25rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-2 py-2.5">
          <div className="skeleton mx-auto h-3 w-5" />
          <div className="skeleton size-11" />
          <div className="space-y-2 py-[3px]">
            <div className="skeleton h-3.5" style={{ width: `${38 + ((i * 17) % 34)}%` }} />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton size-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}
