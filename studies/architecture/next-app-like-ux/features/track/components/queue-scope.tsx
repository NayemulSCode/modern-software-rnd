"use client";

import { createContext, type ReactNode, use } from "react";
import type { Track } from "@/features/track/types";

const QueueContext = createContext<Track[]>([]);

/**
 * Wraps a list of tracks so every play button inside knows what should play
 * next. The rows themselves stay Server Components: only this thin wrapper
 * and the buttons are client code.
 */
export function QueueScope({ queue, children }: { queue: Track[]; children: ReactNode }) {
  return <QueueContext value={queue}>{children}</QueueContext>;
}

export function useQueue(): Track[] {
  return use(QueueContext);
}
