import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { simulateLatency } from "@/lib/delay";
import type { Track, TrackNeighbors, TrackWithFavorite } from "./types";

const trackSelect = {
  id: true,
  title: true,
  artist: true,
  genre: true,
  bpm: true,
  durationSec: true,
  seed: true,
  position: true,
} as const;

/** Cache tags, in one place so reads and mutations can't drift apart. */
export const trackTags = {
  all: "tracks",
  one: (id: string) => `track-${id}`,
  favorites: (userId: string) => `user-favorites-${userId}`,
};

// ---------------------------------------------------------------------------
// Cached reads (lesson 02). The function arguments are the cache key; the
// tags are what a Server Action expires after a write (lesson 05).
// ---------------------------------------------------------------------------

export async function getTrack(id: string): Promise<Track | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(trackTags.all, trackTags.one(id));

  await simulateLatency();
  return prisma.track.findUnique({ where: { id }, select: trackSelect });
}

export async function getLibrary(): Promise<Track[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(trackTags.all);

  await simulateLatency();
  return prisma.track.findMany({ orderBy: { position: "asc" }, select: trackSelect });
}

export async function getNewReleases(limit = 6): Promise<Track[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(trackTags.all);

  await simulateLatency();
  return prisma.track.findMany({ orderBy: { createdAt: "desc" }, take: limit, select: trackSelect });
}

export async function getTrackNeighbors(position: number): Promise<TrackNeighbors> {
  "use cache";
  cacheLife("hours");
  cacheTag(trackTags.all);

  const [previous, next] = await Promise.all([
    prisma.track.findUnique({ where: { position: position - 1 }, select: { id: true, title: true } }),
    prisma.track.findUnique({ where: { position: position + 1 }, select: { id: true, title: true } }),
  ]);
  return { previous, next };
}

export async function getFavoriteIds(userId: string): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(trackTags.favorites(userId));

  const rows = await prisma.favorite.findMany({ where: { userId }, select: { trackId: true } });
  return rows.map((row) => row.trackId);
}

export async function getFavoriteTracks(userId: string): Promise<Track[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(trackTags.all, trackTags.favorites(userId));

  await simulateLatency();
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { track: { select: trackSelect } },
  });
  return rows.map((row) => row.track);
}

// ---------------------------------------------------------------------------
// Dynamic reads. No `'use cache'`, so they run on every request and their
// callers must be wrapped in <Suspense> (lesson 07).
// ---------------------------------------------------------------------------

/**
 * "More like this" is reshuffled per request, so it is deliberately uncached.
 * `connection()` tells Next.js "wait for a real request" — without it a fast
 * local database could let this be prerendered once at build time.
 */
export async function getRecommendations(trackId: string, limit = 5): Promise<Track[]> {
  await connection();
  await simulateLatency(1.8);

  const current = await prisma.track.findUnique({ where: { id: trackId }, select: { genre: true } });
  const candidates = await prisma.track.findMany({
    where: { id: { not: trackId } },
    select: trackSelect,
  });

  return candidates
    .map((track) => ({
      track,
      score: (track.genre === current?.genre ? 1 : 0) + Math.random(),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.track);
}

export async function getFreshPicks(excludeIds: string[], limit = 4): Promise<Track[]> {
  await connection();
  await simulateLatency(1.4);

  const candidates = await prisma.track.findMany({
    where: { id: { notIn: excludeIds } },
    select: trackSelect,
  });
  return candidates.sort(() => Math.random() - 0.5).slice(0, limit);
}

export async function searchTracks(query: string, limit = 8): Promise<Track[]> {
  const term = query.trim();
  if (!term) return [];

  await simulateLatency(0.4);
  return prisma.track.findMany({
    where: {
      OR: [{ title: { contains: term } }, { artist: { contains: term } }, { genre: { contains: term } }],
    },
    orderBy: { position: "asc" },
    take: limit,
    select: trackSelect,
  });
}

export function withFavorites(tracks: Track[], favoriteIds: string[]): TrackWithFavorite[] {
  const favorites = new Set(favoriteIds);
  return tracks.map((track) => ({ ...track, isFavorite: favorites.has(track.id) }));
}
