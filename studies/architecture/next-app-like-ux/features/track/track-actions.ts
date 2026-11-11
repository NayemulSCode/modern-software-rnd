"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/features/user/current-user";
import { prisma } from "@/lib/db";
import { simulateLatency } from "@/lib/delay";
import { type ActionResult, fail, ok } from "@/lib/result";
import { trackTags } from "./track-queries";

const trackIdSchema = z.string().min(1).max(80);

/**
 * A Server Action is a public HTTP endpoint. Anyone can call it with any
 * argument, so it validates its input and resolves the user itself — it never
 * trusts an id sent by the client.
 */
export async function toggleFavorite(trackId: string): Promise<ActionResult<{ isFavorite: boolean }>> {
  const parsed = trackIdSchema.safeParse(trackId);
  if (!parsed.success) return fail("That track could not be found.");

  const userId = await getCurrentUserId();
  await simulateLatency(0.8);

  try {
    const key = { userId_trackId: { userId, trackId: parsed.data } };
    const existing = await prisma.favorite.findUnique({ where: key });

    if (existing) {
      await prisma.favorite.delete({ where: key });
    } else {
      await prisma.favorite.create({ data: { userId, trackId: parsed.data } });
    }

    // Expire every cached read that shows this user's favorites: the heart on
    // each track row and the Favorites page. Unlike revalidateTag, updateTag
    // makes the very next render wait for fresh data (read-your-own-writes).
    updateTag(trackTags.favorites(userId));
    return ok({ isFavorite: !existing });
  } catch (error) {
    console.error("toggleFavorite failed", error);
    return fail("Could not update your favorites. Please try again.");
  }
}
