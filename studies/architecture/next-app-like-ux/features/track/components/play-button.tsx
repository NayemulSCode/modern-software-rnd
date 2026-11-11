"use client";

import clsx from "clsx";
import { Pause, Play } from "lucide-react";
import type { Track } from "@/features/track/types";
import { usePlayer, usePlayerActions } from "@/providers/player-provider";
import { useQueue } from "./queue-scope";

function EqualizerBars() {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-end gap-[2px]">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-[3px] origin-bottom animate-eq rounded-full bg-signal"
          style={{ height: "100%", animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

/** The small button at the start of a track row: index number, play on hover. */
export function RowPlayButton({ track, index }: { track: Track; index: number }) {
  const queue = useQueue();
  const { play } = usePlayerActions();
  // Each selector returns a boolean, so this row only re-renders when ITS
  // answer changes — not on every progress tick or for other rows.
  const isCurrent = usePlayer((s) => s.current?.id === track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const active = isCurrent && isPlaying;

  return (
    <button
      type="button"
      onClick={() => play(track, queue.length > 0 ? queue : [track])}
      aria-label={active ? `Pause ${track.title}` : `Play ${track.title}`}
      className="group/play relative grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
    >
      <span
        className={clsx(
          "font-mono text-xs tabular-nums transition-opacity group-hover/play:opacity-0 group-focus-visible/play:opacity-0",
          isCurrent && "opacity-0",
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        className={clsx(
          "absolute inset-0 grid place-items-center transition-opacity",
          isCurrent ? "opacity-100" : "opacity-0 group-hover/play:opacity-100 group-focus-visible/play:opacity-100",
        )}
      >
        {active ? (
          <>
            <span className="group-hover/play:hidden group-focus-visible/play:hidden">
              <EqualizerBars />
            </span>
            <Pause className="hidden size-4 group-hover/play:block group-focus-visible/play:block" fill="currentColor" />
          </>
        ) : (
          <Play className={clsx("size-4 translate-x-px", isCurrent && "text-signal group-hover/play:text-paper")} fill="currentColor" />
        )}
      </span>
    </button>
  );
}

/** The large round button on track and playlist headers. */
export function HeroPlayButton({ track, queue, label }: { track: Track; queue?: Track[]; label: string }) {
  const { play, toggle } = usePlayerActions();
  const inQueue = usePlayer((s) => Boolean(s.current && (queue ?? [track]).some((t) => t.id === s.current?.id)));
  const isPlaying = usePlayer((s) => s.isPlaying);
  const active = inQueue && isPlaying;

  return (
    <button
      type="button"
      onClick={() => (inQueue ? toggle() : play(track, queue ?? [track]))}
      aria-label={active ? "Pause" : label}
      className="grid size-14 place-items-center rounded-full bg-signal text-paper shadow-[0_6px_0_0_var(--color-signal-deep)] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
    >
      {active ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6 translate-x-0.5" fill="currentColor" />}
    </button>
  );
}
