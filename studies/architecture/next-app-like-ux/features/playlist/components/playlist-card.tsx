import { Lock } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import type { PlaylistSummary } from "@/features/playlist/types";
import { pluralize } from "@/lib/format";

export function PlaylistCard({ playlist, index }: { playlist: PlaylistSummary; index: number }) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group block animate-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative">
        <Cover
          seed={playlist.seed}
          className="w-full transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]"
        />
        {playlist.locked ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-1 font-mono text-[0.625rem] uppercase tracking-widest text-paper">
            <Lock className="size-3" aria-hidden="true" /> Locked
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-2xl leading-tight decoration-signal decoration-2 underline-offset-4 group-hover:underline">
        {playlist.name}
      </h3>
      <p className="eyebrow mt-1">{pluralize(playlist.trackCount, "track")}</p>
    </Link>
  );
}

export function PlaylistShelfSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-square w-full" />
          <div className="skeleton mt-3 h-6 w-3/4" />
          <div className="skeleton mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
