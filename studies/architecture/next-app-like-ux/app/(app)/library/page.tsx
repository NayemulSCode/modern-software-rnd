import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { Crossfade } from "@/components/ui/crossfade";
import { TrackList, TrackListSkeleton } from "@/features/track/components/track-list";
import { getFavoriteIds, getLibrary, withFavorites } from "@/features/track/track-queries";
import { getCurrentUserId } from "@/features/user/current-user";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="space-y-10">
      {/* The heading is outside the boundary, so it is in the prefetched
          shell. tests/navigation.spec.ts asserts exactly that. */}
      <PageHeader eyebrow="Library" title="Everything on the shelf">
        Hover a title and that track is fetched before you click. Leave this page and come back: no skeleton the
        second time.
      </PageHeader>

      <Suspense fallback={<TrackListSkeleton rows={12} />}>
        <Crossfade>
          <LibraryTracks />
        </Crossfade>
      </Suspense>
    </div>
  );
}

async function LibraryTracks() {
  const userId = await getCurrentUserId();
  const [tracks, favoriteIds] = await Promise.all([getLibrary(), getFavoriteIds(userId)]);
  return <TrackList tracks={withFavorites(tracks, favoriteIds)} label="All tracks" />;
}
