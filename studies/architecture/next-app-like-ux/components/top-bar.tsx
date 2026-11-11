import { CommandPalette } from "@/features/search/components/command-palette";
import { NavLink } from "./nav-link";
import { PatternHint } from "./pattern-hint";
import { Brand } from "./sidebar";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-5 py-3 sm:px-8 lg:px-12">
        <div className="lg:hidden">
          <Brand />
        </div>
        <CommandPalette />
        <div className="ml-auto">
          <PatternHint />
        </div>
      </div>

      {/* Below the lg breakpoint the sidebar is hidden, so the same
          destinations are offered as a horizontally scrollable tab row. */}
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-4 pb-2.5 sm:px-7 lg:hidden">
        <NavLink href="/" exact variant="tab">
          Home
        </NavLink>
        <NavLink href="/library" variant="tab">
          Library
        </NavLink>
        <NavLink href="/favorites" variant="tab">
          Favorites
        </NavLink>
        <NavLink href="/learn" variant="tab">
          The guide
        </NavLink>
      </nav>
    </header>
  );
}
