import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cover } from "@/components/cover";
import { SectionHeading } from "@/components/page-header";
import { Crossfade } from "@/components/ui/crossfade";
import { DirectionalSlide } from "@/components/ui/directional-slide";
import { AddToPlaylist } from "@/features/playlist/components/add-to-playlist";
import { getPlaylistIdsContaining, getPlaylists } from "@/features/playlist/playlist-queries";
import { FavoriteButton } from "@/features/track/components/favorite-button";
import { HeroPlayButton } from "@/features/track/components/play-button";
import { TrackList, TrackListSkeleton } from "@/features/track/components/track-list";
import {
  getFavoriteIds,
  getRecommendations,
  getTrack,
  getTrackNeighbors,
  withFavorites,
} from "@/features/track/track-queries";
import { getCurrentUserId } from "@/features/user/current-user";
import { formatDuration } from "@/lib/format";

type Params = PageProps<"/track/[id]">["params"];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  // Same cached function the page uses, so this costs no extra query.
  const track = await getTrack(id);
  return track ? { title: `${track.title} by ${track.artist}` } : { title: "Track not found" };
}

/**
 * `params` is a promise that only resolves at request time, so the page does
 * not await it. It passes the promise down and returns its Suspense
 * boundaries immediately. That is what makes the route "instant" (lesson 01).
 */
export default function TrackPage({ params }: { params: Params }) {
  return (
    <DirectionalSlide name="track-page">
      <Suspense fallback={<TrackHeaderSkeleton />}>
        <TrackContent params={params} />
      </Suspense>
    </DirectionalSlide>
  );
}

async function TrackContent({ params }: { params: Params }) {
  const { id } = await params;
  const track = await getTrack(id);
  if (!track) notFound();

  return (
    <div className="space-y-12">
      <Crossfade>
        <TrackHeader id={id} />
      </Crossfade>

      {/* Lesson 07: a boundary nested inside the header's boundary. Both
          reads start together, but this section is never shown before the
          header above it, so the page fills in from the top down. */}
      <section aria-labelledby="track-more">
        <SectionHeading id="track-more" title="More like this" note="Dynamic · slower on purpose" />
        <Suspense fallback={<TrackListSkeleton rows={5} />}>
          <Crossfade>
            <MoreLikeThis id={id} />
          </Crossfade>
        </Suspense>
      </section>
    </div>
  );
}

async function TrackHeader({ id }: { id: string }) {
  const userId = await getCurrentUserId();
  const track = await getTrack(id);
  if (!track) notFound();

  const [favoriteIds, neighbors, playlists, memberIds] = await Promise.all([
    getFavoriteIds(userId),
    getTrackNeighbors(track.position),
    getPlaylists(userId),
    getPlaylistIdsContaining(id),
  ]);
  const trackWithFavorite = { ...track, isFavorite: favoriteIds.includes(track.id) };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-end">
        <Cover seed={track.seed} className="w-full max-w-72 shadow-[10px_10px_0_0_var(--color-ink)]" />

        <div>
          <p className="eyebrow">
            {track.genre} · {track.bpm} bpm · {formatDuration(track.durationSec)}
          </p>
          <h1 className="mt-2 text-balance font-display text-6xl leading-[0.95] tracking-tight sm:text-8xl">
            {track.title}
          </h1>
          <p className="mt-3 text-xl text-ink-soft">{track.artist}</p>

          <div className="mt-6 flex items-center gap-3">
            <HeroPlayButton track={track} label={`Play ${track.title}`} />
            <FavoriteButton
              trackId={track.id}
              title={track.title}
              isFavorite={trackWithFavorite.isFavorite}
              className="size-11 border border-rule"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">In your playlists</p>
        <AddToPlaylist track={trackWithFavorite} playlists={playlists} memberIds={memberIds} />
      </div>

      {/* Lesson 11: transitionTypes labels the direction of travel, and
          <DirectionalSlide> turns that label into a slide left or right. */}
      <nav aria-label="Neighbouring tracks" className="flex justify-between gap-4 border-y border-rule py-3">
        {neighbors.previous ? (
          <Link
            href={`/track/${neighbors.previous.id}`}
            prefetch={true}
            transitionTypes={["nav-back"]}
            className="group inline-flex min-w-0 items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span className="sr-only">Previous track:</span>
            <span className="truncate">{neighbors.previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {neighbors.next ? (
          <Link
            href={`/track/${neighbors.next.id}`}
            prefetch={true}
            transitionTypes={["nav-forward"]}
            className="group inline-flex min-w-0 items-center gap-2 text-right text-sm"
          >
            <span className="sr-only">Next track:</span>
            <span className="truncate">{neighbors.next.title}</span>
            <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

async function MoreLikeThis({ id }: { id: string }) {
  const userId = await getCurrentUserId();
  const [tracks, favoriteIds] = await Promise.all([getRecommendations(id), getFavoriteIds(userId)]);
  return <TrackList tracks={withFavorites(tracks, favoriteIds)} label="More like this" />;
}

function TrackHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-end">
        <div className="skeleton aspect-square w-full max-w-72" />
        <div>
          <div className="skeleton h-3 w-40" />
          <div className="skeleton mt-4 h-16 w-4/5 sm:h-24" />
          <div className="skeleton mt-4 h-6 w-48" />
          <div className="mt-6 flex gap-3">
            <div className="skeleton size-14 rounded-full" />
            <div className="skeleton size-11 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[7, 6, 8, 7, 6].map((width, i) => (
          <div key={i} className="skeleton h-9 rounded-full" style={{ width: `${width}rem` }} />
        ))}
      </div>
      <div className="skeleton h-11 w-full" />
    </div>
  );
}
