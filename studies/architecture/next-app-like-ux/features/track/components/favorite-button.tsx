"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleFavorite } from "@/features/track/track-actions";

type FavoriteButtonProps = {
  trackId: string;
  title: string;
  /** The confirmed value from the server. The optimistic value layers on top. */
  isFavorite: boolean;
  className?: string;
};

/**
 * Lesson 08. The heart flips the instant you click. `isFavorite` is the last
 * value the server confirmed; `optimisticFavorite` is what we show while the
 * Server Action is running. If the action fails, the transition ends without
 * `isFavorite` having changed, and React snaps back to it automatically.
 */
export function FavoriteButton({ trackId, title, isFavorite, className }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite);
      try {
        const result = await toggleFavorite(trackId);
        if (!result.ok) toast.error(result.error);
      } catch (error) {
        console.error("toggleFavorite request failed", error);
        toast.error("Could not reach the server. Your change was undone.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={optimisticFavorite}
      aria-label={optimisticFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      // Present only while an un-favourite is in flight. The Favorites page
      // dims the row with `has-data-removing:opacity-50` (lesson 11).
      data-removing={isFavorite && !optimisticFavorite ? "" : undefined}
      data-pending={isPending ? "" : undefined}
      className={clsx(
        "grid size-9 place-items-center rounded-full transition-colors hover:bg-paper-deep",
        optimisticFavorite ? "text-signal" : "text-ink-faint hover:text-ink",
        className,
      )}
    >
      <Heart
        className={clsx("size-[18px] transition-transform duration-200", optimisticFavorite && "scale-110")}
        fill={optimisticFavorite ? "currentColor" : "none"}
      />
    </button>
  );
}
