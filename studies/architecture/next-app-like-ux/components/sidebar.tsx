import { GraduationCap, Heart, House, Library, Lock } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getPlaylists } from "@/features/playlist/playlist-queries";
import { getCurrentUserId } from "@/features/user/current-user";
import { Cover } from "./cover";
import { NavLink } from "./nav-link";

export function Brand() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-1.5" aria-label="Tempo, home">
      <span className="font-display text-4xl italic leading-none tracking-tight">Tempo</span>
      <span className="size-2 rounded-full bg-signal transition-transform group-hover:scale-150" />
    </Link>
  );
}

async function SidebarPlaylists() {
  const playlists = await getPlaylists(await getCurrentUserId());

  return (
    <ul className="space-y-0.5">
      {playlists.map((playlist) => (
        <li key={playlist.id}>
          {/* Default prefetch: only the shared /playlist/[id] App Shell is
              fetched ahead of time. Compare with track links (lesson 03). */}
          <NavLink href={`/playlist/${playlist.id}`}>
            <Cover seed={playlist.seed} className="size-7" />
            <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
            {playlist.locked ? <Lock className="size-3.5 opacity-60" aria-label="Locked" /> : null}
            <span className="font-mono text-[0.6875rem] tabular-nums opacity-60">{playlist.trackCount}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function SidebarPlaylistsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="skeleton size-7" />
          <div className="skeleton h-3.5 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-(--sidebar-width) flex-col border-r border-rule bg-paper/80 pb-(--player-height) backdrop-blur-sm lg:flex">
      <div className="px-6 pb-6 pt-7">
        <Brand />
        <p className="eyebrow mt-2">Learn Next.js by ear</p>
      </div>

      <nav aria-label="Main" className="px-3">
        <ul className="space-y-0.5">
          <li>
            <NavLink href="/" exact>
              <House className="size-4" aria-hidden="true" /> Home
            </NavLink>
          </li>
          <li>
            <NavLink href="/library">
              <Library className="size-4" aria-hidden="true" /> Library
            </NavLink>
          </li>
          <li>
            <NavLink href="/favorites">
              <Heart className="size-4" aria-hidden="true" /> Favorites
            </NavLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Playlists" className="mt-7 min-h-0 flex-1 overflow-y-auto px-3">
        <h2 className="eyebrow px-3 pb-2">Playlists</h2>
        <Suspense fallback={<SidebarPlaylistsSkeleton />}>
          <SidebarPlaylists />
        </Suspense>
      </nav>

      <div className="border-t border-rule p-3">
        <NavLink href="/learn">
          <GraduationCap className="size-4" aria-hidden="true" />
          <span className="flex-1">The guide</span>
          <span className="font-mono text-[0.6875rem] opacity-60">13 lessons</span>
        </NavLink>
      </div>
    </aside>
  );
}
