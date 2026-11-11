"use client";

import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useId, useRef } from "react";
import { lessonsForPath } from "@/lib/lessons";

function PatternHintContent() {
  const pathname = usePathname();
  const popoverId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const match = lessonsForPath(pathname);
  if (!match) return null;

  return (
    <>
      {/* The Popover API: open/close, light dismiss and Escape handling come
          from the browser. No state, no click-outside listener. */}
      <button
        type="button"
        popoverTarget={popoverId}
        className="inline-flex items-center gap-2 rounded-full border border-rule bg-card px-3 py-1.5 text-sm transition-colors hover:border-ink"
      >
        <Lightbulb className="size-4 text-signal" aria-hidden="true" />
        <span className="hidden sm:inline">Patterns on this page</span>
        <span className="font-mono text-xs text-ink-faint">{match.lessons.length}</span>
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        popover="auto"
        className="inset-auto right-4 top-16 m-0 w-[min(22rem,calc(100vw-2rem))] rounded-[4px] border border-ink bg-card p-0 text-ink shadow-[6px_6px_0_0_var(--color-ink)]"
      >
        <div className="border-b border-rule px-4 py-3">
          <p className="eyebrow">What the {match.label} page demonstrates</p>
        </div>
        <ul>
          {match.lessons.map((lesson) => (
            <li key={lesson.slug} className="border-b border-rule last:border-0">
              <Link
                href={`/learn/${lesson.slug}`}
                onClick={() => popoverRef.current?.hidePopover()}
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-paper-deep"
              >
                <span className="font-mono text-xs text-signal">{lesson.number}</span>
                <span>
                  <span className="block font-medium leading-tight">{lesson.title}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{lesson.blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function PatternHint() {
  return (
    <Suspense fallback={null}>
      <PatternHintContent />
    </Suspense>
  );
}
