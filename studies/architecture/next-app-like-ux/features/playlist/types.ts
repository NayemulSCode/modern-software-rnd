import type { Track, TrackWithFavorite } from "@/features/track/types";

export type PlaylistSummary = {
  id: string;
  name: string;
  description: string;
  locked: boolean;
  seed: number;
  trackCount: number;
};

export type PlaylistDetail = Omit<PlaylistSummary, "trackCount"> & { tracks: Track[] };

/**
 * One user edit to a playlist. The client keeps a list of these while they
 * are being saved and replays them on top of the server data (lesson 09).
 * `add` carries the whole track so it can be drawn before the server answers.
 */
export type PlaylistChange =
  | { type: "add"; playlistId: string; track: TrackWithFavorite }
  | { type: "remove"; playlistId: string; trackId: string }
  | { type: "move"; playlistId: string; trackId: string; direction: "up" | "down" };

/** What actually crosses the network: ids only, never client-supplied data. */
export type PlaylistChangePayload =
  | { type: "add"; playlistId: string; trackId: string }
  | { type: "remove"; playlistId: string; trackId: string }
  | { type: "move"; playlistId: string; trackId: string; direction: "up" | "down" };
