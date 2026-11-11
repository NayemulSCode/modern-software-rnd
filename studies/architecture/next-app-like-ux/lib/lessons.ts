/**
 * The lesson index. `slug` is both the URL (/learn/<slug>) and the Markdown
 * filename (docs/<slug>.md), so the repo docs and the in-app guide are the
 * same files.
 */
export type Lesson = {
  slug: string;
  number: string;
  title: string;
  blurb: string;
};

export const LESSONS: Lesson[] = [
  {
    slug: "00-mental-model",
    number: "00",
    title: "The mental model",
    blurb: "Server or client, static or cached or dynamic. The two questions behind every decision.",
  },
  {
    slug: "01-instant-navigation",
    number: "01",
    title: "Instant navigation",
    blurb: "Why a click should paint something immediately, and the config that makes it possible.",
  },
  {
    slug: "02-caching",
    number: "02",
    title: "Caching across navigations",
    blurb: "'use cache', cache keys, lifetimes and tags. Skip the spinner on a return visit.",
  },
  {
    slug: "03-prefetching",
    number: "03",
    title: "Prefetching",
    blurb: "App Shells by default, and when prefetch={true} is worth the extra request.",
  },
  {
    slug: "04-client-interactivity",
    number: "04",
    title: "Client interactivity",
    blurb: "Where 'use client' goes, and a provider that survives navigation.",
  },
  {
    slug: "05-revalidation",
    number: "05",
    title: "Revalidating after mutations",
    blurb: "Server Actions and updateTag: change data once, see it everywhere.",
  },
  {
    slug: "06-offline",
    number: "06",
    title: "Handling connection drops",
    blurb: "Wait and retry instead of an error page. Experimental.",
  },
  {
    slug: "07-streaming",
    number: "07",
    title: "Streaming with Suspense",
    blurb: "Boundaries, skeletons and nesting, so pages settle from the top down.",
  },
  {
    slug: "08-optimistic-updates",
    number: "08",
    title: "Optimistic updates",
    blurb: "useOptimistic and useTransition: respond before the server does, roll back if it says no.",
  },
  {
    slug: "09-queued-mutations",
    number: "09",
    title: "Queued mutations",
    blurb: "useActionState as a queue, so rapid edits save in order.",
  },
  {
    slug: "10-client-fetching",
    number: "10",
    title: "Fetching on the client",
    blurb: "When the browser should fetch, and how SWR keeps it tidy.",
  },
  {
    slug: "11-view-transitions",
    number: "11",
    title: "View Transitions",
    blurb: "Reveals, morphs and directional slides that explain what just changed.",
  },
  {
    slug: "12-testing",
    number: "12",
    title: "Testing instant navigation",
    blurb: "Playwright's instant() helper locks the behaviour in.",
  },
  {
    slug: "checklist",
    number: "✓",
    title: "The frontend checklist",
    blurb: "What to remember when you configure and build any Next.js app.",
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}

/** Which lessons each route demonstrates. Drives the "Patterns on this page" popover. */
const ROUTE_LESSONS: Array<{ match: (pathname: string) => boolean; label: string; slugs: string[] }> = [
  {
    match: (p) => p === "/",
    label: "Home",
    slugs: ["01-instant-navigation", "02-caching", "07-streaming", "03-prefetching"],
  },
  {
    match: (p) => p === "/library",
    label: "Library",
    slugs: ["02-caching", "03-prefetching", "04-client-interactivity"],
  },
  {
    match: (p) => p.startsWith("/track/"),
    label: "Track",
    slugs: ["03-prefetching", "07-streaming", "09-queued-mutations", "11-view-transitions"],
  },
  {
    match: (p) => p.startsWith("/playlist/"),
    label: "Playlist",
    slugs: ["09-queued-mutations", "08-optimistic-updates", "05-revalidation"],
  },
  {
    match: (p) => p === "/favorites",
    label: "Favorites",
    slugs: ["08-optimistic-updates", "05-revalidation", "11-view-transitions"],
  },
  {
    match: (p) => p.startsWith("/learn"),
    label: "Learn",
    slugs: ["04-client-interactivity", "02-caching"],
  },
];

export function lessonsForPath(pathname: string): { label: string; lessons: Lesson[] } | null {
  const route = ROUTE_LESSONS.find((entry) => entry.match(pathname));
  if (!route) return null;
  return {
    label: route.label,
    lessons: route.slugs.map(getLesson).filter((lesson): lesson is Lesson => Boolean(lesson)),
  };
}
