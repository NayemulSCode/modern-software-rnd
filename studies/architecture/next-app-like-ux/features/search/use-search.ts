"use client";

import useSWR from "swr";
import type { SearchResponse } from "@/app/api/search/route";
import { fetchJson } from "@/lib/fetch-json";

export const MIN_QUERY_LENGTH = 2;

export function useSearch(query: string) {
  const term = query.trim();
  // A `null` key tells SWR not to fetch at all. The key is also the cache
  // key: typing "glass", deleting it and typing it again is served from
  // memory, and two components asking for the same key share one request.
  const key = term.length >= MIN_QUERY_LENGTH ? `/api/search?q=${encodeURIComponent(term)}` : null;

  return useSWR<SearchResponse, Error>(key, fetchJson, {
    // Keep showing the last results while the next ones load, instead of
    // flashing an empty list between keystrokes.
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
}
