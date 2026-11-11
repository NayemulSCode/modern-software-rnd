"use client";

import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import Link from "next/link";
import { coverStyle } from "@/lib/cover-art";
import { formatDuration } from "@/lib/format";
import { usePlayer, usePlayerActions } from "@/providers/player-provider";

// Only this small component subscribes to `position`, so the four-times-a-
// second progress update re-renders the slider and nothing else.
function ProgressSlider({ durationSec }: { durationSec: number }) {
  const position = usePlayer((s) => s.position);
  const { seek } = usePlayerActions();
  const percent = durationSec > 0 ? (position / durationSec) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-9 text-right font-mono text-[0.6875rem] tabular-nums text-paper/70">
        {formatDuration(position)}
      </span>
      <input
        type="range"
        min={0}
        max={durationSec}
        step={1}
        value={Math.floor(position)}
        onChange={(event) => seek(Number(event.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(position)} of ${formatDuration(durationSec)}`}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-paper [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper"
        style={{
          background: `linear-gradient(to right, var(--color-signal) ${percent}%, rgb(242 234 219 / 0.22) ${percent}%)`,
        }}
      />
      <span className="w-9 font-mono text-[0.6875rem] tabular-nums text-paper/70">{formatDuration(durationSec)}</span>
    </div>
  );
}

function VolumeSlider() {
  const volume = usePlayer((s) => s.volume);
  const { setVolume } = usePlayerActions();

  return (
    <label className="hidden items-center gap-2 md:flex">
      <Volume2 className="size-4 text-paper/70" aria-hidden="true" />
      <span className="sr-only">Volume</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        className="h-1 w-24 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-paper [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper"
        style={{
          background: `linear-gradient(to right, var(--color-paper) ${volume * 100}%, rgb(242 234 219 / 0.22) ${volume * 100}%)`,
        }}
      />
    </label>
  );
}

const controlButton =
  "grid size-9 place-items-center rounded-full text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent";

export function NowPlayingBar() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const hasQueue = usePlayer((s) => s.queue.length > 1);
  const { toggle, next, previous } = usePlayerActions();

  return (
    <section
      aria-label="Player"
      // A named view-transition element is captured separately from the page,
      // so it stays still while content slides underneath (lesson 11).
      style={{ viewTransitionName: "player-bar" }}
      className="fixed inset-x-0 bottom-0 z-30 h-(--player-height) bg-ink text-paper"
    >
      <div className="mx-auto grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          {current ? (
            <>
              <div aria-hidden="true" className="size-12 shrink-0 rounded-[3px]" style={coverStyle(current.seed)} />
              <div className="min-w-0">
                <Link
                  href={`/track/${current.id}`}
                  prefetch={true}
                  className="block truncate font-medium underline-offset-4 hover:underline"
                >
                  {current.title}
                </Link>
                <p className="truncate text-sm text-paper/60">{current.artist}</p>
              </div>
            </>
          ) : (
            <p className="font-display text-xl italic text-paper/70">Pick a track to start listening.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-end gap-1 md:justify-center">
            <button type="button" onClick={previous} disabled={!current} aria-label="Previous track" className={controlButton}>
              <SkipBack className="size-4" fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={toggle}
              disabled={!current}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid size-10 place-items-center rounded-full bg-paper text-ink transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            >
              {isPlaying ? (
                <Pause className="size-4" fill="currentColor" />
              ) : (
                <Play className="size-4 translate-x-px" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={() => next()}
              disabled={!current || !hasQueue}
              aria-label="Next track"
              className={controlButton}
            >
              <SkipForward className="size-4" fill="currentColor" />
            </button>
          </div>
          {current ? (
            <div className="hidden md:block">
              <ProgressSlider durationSec={current.durationSec} />
            </div>
          ) : null}
        </div>

        <div className="hidden justify-end md:flex">
          <VolumeSlider />
        </div>
      </div>
    </section>
  );
}
