"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/features/user/current-user";
import { prisma } from "@/lib/db";
import { simulateLatency } from "@/lib/delay";
import { type ActionResult, fail, ok } from "@/lib/result";
import { playlistTags } from "./playlist-queries";
import type { PlaylistChangePayload } from "./types";

const id = z.string().min(1).max(80);

const changeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add"), playlistId: id, trackId: id }),
  z.object({ type: z.literal("remove"), playlistId: id, trackId: id }),
  z.object({ type: z.literal("move"), playlistId: id, trackId: id, direction: z.enum(["up", "down"]) }),
]);

export async function savePlaylistChange(input: PlaylistChangePayload): Promise<ActionResult<{ message: string }>> {
  const parsed = changeSchema.safeParse(input);
  if (!parsed.success) return fail("That change was not valid.");
  const change = parsed.data;

  const userId = await getCurrentUserId();
  await simulateLatency(0.8);

  try {
    // Authorization happens on the server, against the database — the UI
    // hiding a button is a convenience, not a permission check.
    const playlist = await prisma.playlist.findFirst({
      where: { id: change.playlistId, ownerId: userId },
      select: { name: true, locked: true },
    });
    if (!playlist) return fail("That playlist no longer exists.");
    if (playlist.locked) return fail(`“${playlist.name}” is locked, so the change was undone.`);

    const message = await applyChange(change, playlist.name);

    updateTag(playlistTags.one(change.playlistId));
    // Track counts and "already in playlist" ticks come from the list tag.
    if (change.type !== "move") updateTag(playlistTags.all);

    return ok({ message });
  } catch (error) {
    console.error("savePlaylistChange failed", error);
    return fail("Could not save that change. Please try again.");
  }
}

async function applyChange(change: z.infer<typeof changeSchema>, playlistName: string): Promise<string> {
  const { playlistId, trackId } = change;

  switch (change.type) {
    case "add": {
      const last = await prisma.playlistTrack.findFirst({
        where: { playlistId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await prisma.playlistTrack.upsert({
        where: { playlistId_trackId: { playlistId, trackId } },
        update: {},
        create: { playlistId, trackId, position: (last?.position ?? -1) + 1 },
      });
      return `Added to ${playlistName}`;
    }

    case "remove": {
      await prisma.playlistTrack.deleteMany({ where: { playlistId, trackId } });
      return `Removed from ${playlistName}`;
    }

    case "move": {
      const entries = await prisma.playlistTrack.findMany({
        where: { playlistId },
        orderBy: { position: "asc" },
        select: { trackId: true },
      });
      const from = entries.findIndex((entry) => entry.trackId === trackId);
      const to = change.direction === "up" ? from - 1 : from + 1;
      if (from === -1 || to < 0 || to >= entries.length) return "Order unchanged";

      [entries[from], entries[to]] = [entries[to], entries[from]];
      // Rewrite every position in one transaction so a failure can't leave
      // the playlist half reordered.
      await prisma.$transaction(
        entries.map((entry, position) =>
          prisma.playlistTrack.update({
            where: { playlistId_trackId: { playlistId, trackId: entry.trackId } },
            data: { position },
          }),
        ),
      );
      return "Order saved";
    }
  }
}
