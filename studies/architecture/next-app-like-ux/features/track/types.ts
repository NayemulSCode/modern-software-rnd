// Plain serializable shapes. Anything passed from a Server Component to a
// Client Component crosses the network, so no Date objects or Prisma models.
export type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  durationSec: number;
  seed: number;
  position: number;
};

export type TrackWithFavorite = Track & { isFavorite: boolean };

export type TrackNeighbors = {
  previous: Pick<Track, "id" | "title"> | null;
  next: Pick<Track, "id" | "title"> | null;
};
