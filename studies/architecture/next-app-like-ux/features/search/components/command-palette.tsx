"use client";

import clsx from "clsx";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { Cover } from "@/components/cover";
import { MIN_QUERY_LENGTH, useSearch } from "@/features/search/use-search";

export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // The input updates on every keystroke; the search uses a value React may
  // delay while you are still typing. That alone removes most wasted requests.
  const deferredQuery = useDeferredValue(query);
  const { data, error, isLoading } = useSearch(deferredQuery);

  const tooShort = query.trim().length < MIN_QUERY_LENGTH;
  const tracks = tooShort ? [] : (data?.tracks ?? []);
  const isStale = query !== deferredQuery || isLoading;

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (dialog.open) dialog.close();
        else dialog.showModal();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openTrack(trackId: string) {
    dialogRef.current?.close();
    router.push(`/track/${trackId}`);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (tracks.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % tracks.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + tracks.length) % tracks.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const track = tracks[Math.min(activeIndex, tracks.length - 1)];
      if (track) openTrack(track.id);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink sm:max-w-xs"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">Search tracks, artists, genres</span>
        <kbd className="hidden rounded-[3px] border border-rule px-1.5 font-mono text-[0.6875rem] sm:inline">Ctrl K</kbd>
      </button>

      {/* A native <dialog> gives focus trapping, Escape to close and the
          backdrop for free, and is announced correctly by screen readers. */}
      <dialog
        ref={dialogRef}
        aria-label="Search"
        onClose={() => {
          setQuery("");
          setActiveIndex(0);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] rounded-[4px] border border-ink bg-card p-0 text-ink shadow-[8px_8px_0_0_var(--color-ink)] backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-center gap-3 border-b border-rule px-4">
          {isStale && !tooShort ? (
            <LoaderCircle className="size-5 shrink-0 animate-spin text-signal" aria-hidden="true" />
          ) : (
            <Search className="size-5 shrink-0 text-ink-faint" aria-hidden="true" />
          )}
          {/* type="text", not "search": in Chrome a search field uses the first
              Escape to clear itself, so the dialog would need two presses. */}
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={tracks.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={tracks[activeIndex] ? `${listId}-${tracks[activeIndex].id}` : undefined}
            aria-label="Search tracks"
            placeholder="Search tracks, artists, genres…"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded-[3px] border border-rule px-1.5 font-mono text-[0.6875rem] text-ink-faint">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {error ? (
            <p role="alert" className="px-4 py-6 text-sm text-signal-deep">
              Search is unavailable right now. Check your connection and try again.
            </p>
          ) : tooShort ? (
            <p className="px-4 py-6 text-sm text-ink-soft">
              Type at least {MIN_QUERY_LENGTH} characters. Try “night”, “house” or “Mira”.
            </p>
          ) : tracks.length === 0 && !isStale ? (
            <p className="px-4 py-6 text-sm text-ink-soft">Nothing matches “{query.trim()}”.</p>
          ) : null}

          <ul id={listId} role="listbox" aria-label="Results" className={clsx(isStale && "opacity-60")}>
            {tracks.map((track, index) => (
              <li
                key={track.id}
                id={`${listId}-${track.id}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => openTrack(track.id)}
                onMouseMove={() => setActiveIndex(index)}
                className="flex cursor-pointer items-center gap-3 border-b border-rule px-4 py-2.5 last:border-0 aria-selected:bg-paper-deep"
              >
                <Cover seed={track.seed} className="size-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{track.title}</span>
                  <span className="block truncate text-sm text-ink-soft">{track.artist}</span>
                </span>
                <span className="eyebrow">{track.genre}</span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
