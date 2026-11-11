import { Suspense } from "react";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { Crossfade } from "@/components/ui/crossfade";
import { PlaylistCard, PlaylistShelfSkeleton } from "@/features/playlist/components/playlist-card";
import { getPlaylists } from "@/features/playlist/playlist-queries";
import { TrackList, TrackListSkeleton } from "@/features/track/components/track-list";
import { getFavoriteIds, getFreshPicks, getNewReleases, withFavorites } from "@/features/track/track-queries";
import { getCurrentUserId } from "@/features/user/current-user";

/**
 * The page itself is synchronous: it renders the heading and three
 * <Suspense> boundaries and returns immediately. Each section fetches its
 * own data, in parallel, and appears when it is ready (lesson 07).
 */
export default function HomePage() {
  return (
    <div className="space-y-14">
      <PageHeader eyebrow="Home" title={<>Thirty-six tracks, <em>no waiting.</em></>}>
        Every click in this app paints something straight away. Open “Patterns on this page” in the top bar to see
        how.
      </PageHeader>

      <section aria-labelledby="home-playlists">
        <SectionHeading id="home-playlists" title="Playlists" note="Cached · part of the static shell" />
        <Suspense fallback={<PlaylistShelfSkeleton />}>
          <Crossfade>
            <PlaylistShelf />
          </Crossfade>
        </Suspense>
      </section>

      <section aria-labelledby="home-new">
        <SectionHeading id="home-new" title="New arrivals" note="Cached for hours" />
        <Suspense fallback={<TrackListSkeleton rows={6} />}>
          <Crossfade>
            <NewArrivals />
          </Crossfade>
        </Suspense>
      </section>

      <section aria-labelledby="home-fresh">
        <SectionHeading id="home-fresh" title="Shuffled just now" note="Dynamic · streams in on every visit" />
        <Suspense fallback={<TrackListSkeleton rows={4} />}>
          <Crossfade>
            <FreshPicks />
          </Crossfade>
        </Suspense>
      </section>
    </div>
  );
}

async function PlaylistShelf() {
  const playlists = await getPlaylists(await getCurrentUserId());
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
      {playlists.map((playlist, index) => (
        <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
      ))}
    </div>
  );
}

async function NewArrivals() {
  const userId = await getCurrentUserId();
  // Start both reads before awaiting either, so they run in parallel.
  const [tracks, favoriteIds] = await Promise.all([getNewReleases(6), getFavoriteIds(userId)]);
  return <TrackList tracks={withFavorites(tracks, favoriteIds)} label="New arrivals" />;
}

async function FreshPicks() {
  const userId = await getCurrentUserId();
  const [tracks, favoriteIds] = await Promise.all([getFreshPicks([], 4), getFavoriteIds(userId)]);
  return <TrackList tracks={withFavorites(tracks, favoriteIds)} label="Shuffled just now" />;
}
