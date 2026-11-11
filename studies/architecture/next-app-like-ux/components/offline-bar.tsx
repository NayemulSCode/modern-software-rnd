"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "next/offline";

/**
 * Lesson 06. With `experimental.useOffline` on, a navigation or Server Action
 * that fails because the network dropped does not throw: it waits and retries
 * by itself. All this component does is tell the user that is happening.
 */
export function OfflineBar() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-butter px-4 py-2 text-sm font-medium text-ink"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      You are offline. Reconnecting — anything you clicked will finish when the connection returns.
    </div>
  );
}
