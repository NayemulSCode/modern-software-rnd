import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cover } from "@/components/cover";
import { Crossfade } from "@/components/ui/crossfade";
import { PlaylistEditor } from "@/features/playlist/components/playlist-editor";
import { getPlaylist } from "@/features/playlist/playlist-queries";
import { HeroPlayButton } from "@/features/track/components/play-button";
import { TrackListSkeleton } from "@/features/track/components/track-list";
import { getFavoriteIds, getLibrary, withFavorites } from "@/features/track/track-queries";
import { getCurrentUserId } from "@/features/user/current-user";
import { formatDuration, pluralize } from "@/lib/format";

type Params = PageProps<"/playlist/[id]">["params"];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const playlist = await getPlaylist(id);
  return { title: playlist?.name ?? "Playlist not found" };
}

export default function PlaylistPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PlaylistSkeleton />}>
      <Crossfade>
        <PlaylistContent params={params} />
      </Crossfade>
    </Suspense>
  );
}

async function PlaylistContent({ params }: { params: Params }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [playlist, favoriteIds, library] = await Promise.all([getPlaylist(id), getFavoriteIds(userId), getLibrary()]);
  if (!playlist) notFound();

  const tracks = withFavorites(playlist.tracks, favoriteIds);
  const inPlaylist = new Set(tracks.map((track) => track.id));
  const suggestions = withFavorites(
    library.filter((track) => !inPlaylist.has(track.id)).slice(0, 6),
    favoriteIds,
  );
  const totalSeconds = tracks.reduce((sum, track) => sum + track.durationSec, 0);

  return (
    <div className="space-y-10">
      <header className="grid gap-8 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:items-end">
        <Cover seed={playlist.seed} className="w-full max-w-56 shadow-[8px_8px_0_0_var(--color-ink)]" />
        <div>
          <p className="eyebrow">
            Playlist · {pluralize(tracks.length, "track")} · {formatDuration(totalSeconds)}
          </p>
          <h1 className="mt-2 text-balance font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl">
            {playlist.name}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">{playlist.description}</p>
          {tracks[0] ? (
            <div className="mt-6">
              <HeroPlayButton track={tracks[0]} queue={tracks} label={`Play ${playlist.name}`} />
            </div>
          ) : null}
        </div>
      </header>

      {playlist.locked ? (
        <p className="flex items-start gap-3 rounded-[3px] border border-ink bg-butter/40 px-4 py-3 text-[0.9375rem]">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>This playlist is locked on the server.</strong> The buttons still work on purpose: remove or move
            a track and watch the change appear, get rejected, and roll itself back.
          </span>
        </p>
      ) : null}

      <PlaylistEditor playlistId={playlist.id} tracks={tracks} suggestions={suggestions} />
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:items-end">
        <div className="skeleton aspect-square w-full max-w-56" />
        <div>
          <div className="skeleton h-3 w-44" />
          <div className="skeleton mt-4 h-16 w-3/4 sm:h-20" />
          <div className="skeleton mt-4 h-6 w-80 max-w-full" />
          <div className="skeleton mt-6 size-14 rounded-full" />
        </div>
      </div>
      <TrackListSkeleton rows={6} />
    </div>
  );
}
