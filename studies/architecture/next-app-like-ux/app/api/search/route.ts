import type { NextRequest } from "next/server";
import { z } from "zod";
import { searchTracks } from "@/features/track/track-queries";
import type { Track } from "@/features/track/types";

export type SearchResponse = { tracks: Track[] };

const querySchema = z.string().trim().min(2).max(60);

/**
 * Lesson 10. The one place this app fetches from the browser. Search results
 * depend on what the user types, cannot be known ahead of time and are not
 * worth a page navigation — so a small JSON endpoint plus SWR is the right tool.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!parsed.success) {
    return Response.json({ error: "Search needs between 2 and 60 characters." }, { status: 400 });
  }

  try {
    const tracks = await searchTracks(parsed.data);
    return Response.json({ tracks } satisfies SearchResponse);
  } catch (error) {
    console.error("Search failed", error);
    return Response.json({ error: "Search is unavailable right now." }, { status: 500 });
  }
}
