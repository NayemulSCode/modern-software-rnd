import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { simulateLatency } from "@/lib/delay";
import type { PlaylistDetail, PlaylistSummary } from "./types";

export const playlistTags = {
  all: "playlists",
  one: (id: string) => `playlist-${id}`,
};

export async function getPlaylists(userId: string): Promise<PlaylistSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(playlistTags.all);

  await simulateLatency();
  const rows = await prisma.playlist.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      locked: true,
      seed: true,
      _count: { select: { tracks: true } },
    },
  });
  return rows.map(({ _count, ...playlist }) => ({ ...playlist, trackCount: _count.tracks }));
}

export async function getPlaylist(id: string): Promise<PlaylistDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(playlistTags.one(id));

  await simulateLatency();
  const row = await prisma.playlist.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      locked: true,
      seed: true,
      tracks: {
        orderBy: { position: "asc" },
        select: {
          track: {
            select: {
              id: true,
              title: true,
              artist: true,
              genre: true,
              bpm: true,
              durationSec: true,
              seed: true,
              position: true,
            },
          },
        },
      },
    },
  });
  if (!row) return null;
  return { ...row, tracks: row.tracks.map((entry) => entry.track) };
}

/** Ids of the playlists that already contain a track (for the "Add to playlist" menu). */
export async function getPlaylistIdsContaining(trackId: string): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(playlistTags.all);

  const rows = await prisma.playlistTrack.findMany({ where: { trackId }, select: { playlistId: true } });
  return rows.map((row) => row.playlistId);
}
