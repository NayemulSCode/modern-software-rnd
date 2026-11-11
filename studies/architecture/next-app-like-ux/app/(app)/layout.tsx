import { NowPlayingBar } from "@/components/now-playing-bar";
import { OfflineBar } from "@/components/offline-bar";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { PlayerProvider } from "@/providers/player-provider";
import { PlaylistChangesProvider } from "@/providers/playlist-changes-provider";

/**
 * The shared layout for every screen. Three things to notice:
 *
 * 1. It is a Server Component. The providers are Client Components, but
 *    `children` (the pages) are rendered on the server and passed through.
 * 2. It does not re-render on navigation. That is why the player keeps
 *    playing and the sidebar keeps its scroll position between pages.
 * 3. A <Suspense> boundary up here would NOT cover navigations between two
 *    pages below it — each page needs its own (lesson 01).
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <PlayerProvider>
      <PlaylistChangesProvider>
        <OfflineBar />
        <Sidebar />
        <div className="relative z-10 flex min-h-dvh flex-col pb-(--player-height) lg:pl-(--sidebar-width)">
          <TopBar />
          <main className="w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">{children}</main>
        </div>
        <NowPlayingBar />
      </PlaylistChangesProvider>
    </PlayerProvider>
  );
}
