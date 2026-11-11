import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { Crossfade } from "@/components/ui/crossfade";
import { FavoritesFeed } from "@/features/track/components/favorites-feed";
import { TrackList, TrackListSkeleton } from "@/features/track/components/track-list";
import { getFavoriteIds, getFavoriteTracks, getFreshPicks, withFavorites } from "@/features/track/track-queries";
import { getCurrentUserId } from "@/features/user/current-user";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Favorites" title={<>Kept <em>close</em></>}>
        Click a heart to remove a track. It dims at once, the rows below glide up, and the server catches up a
        moment later.
      </PageHeader>

      <Suspense fallback={<TrackListSkeleton rows={5} />}>
        <Crossfade>
          <Favorites />
        </Crossfade>
      </Suspense>

      {/* When the list above gets shorter, this whole section moves up. The
          ViewTransition turns that jump into a slide (lesson 11). */}
      <ViewTransition>
        <section aria-labelledby="favorites-more">
          <SectionHeading id="favorites-more" title="You might also like" note="Dynamic · reshuffled per request" />
          <Suspense fallback={<TrackListSkeleton rows={4} />}>
            <Crossfade>
              <Suggestions />
            </Crossfade>
          </Suspense>
        </section>
      </ViewTransition>
    </div>
  );
}

async function Favorites() {
  const tracks = await getFavoriteTracks(await getCurrentUserId());

  if (tracks.length === 0) {
    return (
      <div className="border-y border-rule py-12 text-center">
        <p className="font-display text-3xl italic">No favorites yet.</p>
        <p className="mt-2 text-ink-soft">
          Tap the heart on any track in the{" "}
          <Link href="/library" className="underline decoration-signal decoration-2 underline-offset-4">
            library
          </Link>
          .
        </p>
      </div>
    );
  }

  return <FavoritesFeed tracks={tracks.map((track) => ({ ...track, isFavorite: true }))} />;
}

async function Suggestions() {
  const favoriteIds = await getFavoriteIds(await getCurrentUserId());
  const tracks = await getFreshPicks(favoriteIds, 4);
  return <TrackList tracks={withFavorites(tracks, favoriteIds)} label="Suggestions" />;
}
