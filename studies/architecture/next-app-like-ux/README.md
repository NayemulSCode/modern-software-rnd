# next-app-like-ux (Tempo)

| | |
|---|---|
| **Question** | How do you make a Next.js app feel as fast as a native app while still rendering on the server? |
| **Status** | `concluded` |
| **Category** | architecture |
| **Stack** | Next.js 16.4.6 (Cache Components, Partial Prefetching) · React 19.3 · TypeScript 5 · Tailwind CSS 4.3 · Prisma 7.10 + SQLite · zod · SWR · Playwright 1.65 |
| **Started** | 2026-11-11 |
| **Last verified** | 2026-11-11 |

## Findings

- **A click feels instant when the next page has a shell ready**, not when the data is fast. With the default 900ms artificial delay, a track's heading was on screen about 120ms after the click on the production build, while its dynamic section arrived about 2 seconds later.
- **`cacheComponents` turns a slow page into a build error.** Reading uncached data outside `<Suspense>` fails `next build` with `blocking-prerender-dynamic`. Structure is enforced instead of remembered.
- **Every page needs its own Suspense boundary.** A boundary in a shared layout does not cover navigation between that layout's pages, and `usePathname()` on a route with unknown params suspends too.
- **Prefetching is production-only.** Navigation speed cannot be judged in `next dev`.
- **`prefetch={true}` on a long list is expensive.** Upgrading from the shared App Shell to a per-link prefetch on hover or focus gets most of the benefit for a fraction of the requests.
- **Optimistic UI needs no rollback code.** `useOptimistic` inside a transition returns to the server's value by itself when an action fails. `useActionState` queues overlapping edits so they save in order.
- **A provider in a layout survives navigation**, and its `children` stay Server Components. Subscribing to slices of an external store keeps fast-changing state (playback position) from re-rendering the page.
- **Chrome's `<input type="search">` swallows the first Escape** to clear itself, which breaks a `<dialog>`-based search palette. Use `type="text"` with `inputMode="search"`.

## Verdict

- **Use it when:** you are building an app people navigate around in (dashboards, players, feeds, tools) on Next.js 16.3 or later. The Suspense-per-page shape, tagged caching and optimistic mutations are worth adopting as defaults.
- **Avoid it when:** the site is mostly static content, where plain static rendering already gives you this. Leave `experimental.useOffline` out of production until it is stable.
- **Cost:** you must classify every read as static, cached or dynamic, and keep cache tags in sync between reads and writes. That is real design work, and mistakes show up as stale data rather than errors.

## Sources

- [Building App-like Experiences with Next.js 16.3](https://nextjs.org/blog/building-app-like-experiences-with-nextjs-16-3) (Next.js blog)
- The docs bundled with the installed version, in `node_modules/next/dist/docs/`

---

## What was built

Tempo: a small music player built to **learn how to make a Next.js app feel like a native app**.

It follows the patterns from the Next.js blog post
[Building App-like Experiences with Next.js 16.3](https://nextjs.org/blog/building-app-like-experiences-with-nextjs-16-3)
and puts all of them into one original app, with a lesson for each. The lessons live in [`docs/`](./docs) and are also rendered inside the app at `/learn`.

No audio files, no images, no accounts: the music is synthesized in your browser, the covers are CSS, and there is one demo user.

## Run it

Requires Node 20.9 or newer.

```bash
npm install
```

`npm install` also creates `.env` from `.env.example` if you do not have one.

```bash
npm run db:setup
```

```bash
npm run dev
```

Open http://localhost:3000.

### Development or production?

They teach different things, so use both.

| | `npm run dev` | `npm run build` then `npm start` |
|---|---|---|
| Good for | Seeing skeletons, streaming, optimistic updates, the DevTools Navigation Inspector | Feeling instant navigation |
| Prefetching | Off | On |
| Speed | Compiles pages on demand | Real |

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build. Fails if uncached data is read outside `<Suspense>` |
| `npm start` | Serves the production build |
| `npm run ci` | Everything CI checks: env file, database, lint, type-check, build |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Playwright end-to-end tests |
| `npm run db:setup` | Generates the Prisma client, creates the SQLite file, seeds it |
| `npm run db:reset` | Wipes the database and seeds it again |

## The demo delay

A local SQLite file answers in under a millisecond, which would hide every loading state. `DEMO_DELAY_MS` in `.env` (default `900`) adds an artificial wait to database reads and writes.

- Raise it (`2500`) to study skeletons, optimistic updates and the mutation queue.
- Set it to `0` to see the real speed.

Restart the server after changing it.

## The lessons

| # | Lesson | See it in the app |
|---|---|---|
| 00 | [The mental model](./docs/00-mental-model.md) | Everywhere |
| 01 | [Instant navigation](./docs/01-instant-navigation.md) | Any link |
| 02 | [Caching across navigations](./docs/02-caching.md) | Library → Home → Library |
| 03 | [Prefetching](./docs/03-prefetching.md) | Hover a track title, then click |
| 04 | [Client interactivity](./docs/04-client-interactivity.md) | Play a track, then navigate |
| 05 | [Revalidating after mutations](./docs/05-revalidation.md) | Favorite on Home, check Favorites |
| 06 | [Handling connection drops](./docs/06-offline.md) | DevTools → Network → Offline |
| 07 | [Streaming with Suspense](./docs/07-streaming.md) | A track page |
| 08 | [Optimistic updates](./docs/08-optimistic-updates.md) | Any heart; the locked "Staff Picks" playlist |
| 09 | [Queued mutations](./docs/09-queued-mutations.md) | Reorder a playlist quickly |
| 10 | [Fetching on the client](./docs/10-client-fetching.md) | Ctrl+K |
| 11 | [View Transitions](./docs/11-view-transitions.md) | Remove a favorite; previous / next track |
| 12 | [Testing instant navigation](./docs/12-testing.md) | `npm test` |
| ✓ | [The frontend checklist](./docs/checklist.md) | Before every project |

In the app, the **Patterns on this page** button in the top bar lists which lessons the current screen demonstrates.

## Folder map

```
app/
  layout.tsx                 html shell, fonts, toasts
  globals.css                design tokens, view-transition CSS, lesson typography
  (app)/layout.tsx           providers + sidebar + player (never re-renders on navigation)
  (app)/page.tsx             Home: static + cached + dynamic sections
  (app)/library/             cached list
  (app)/track/[id]/          nested Suspense, prefetch, directional slide
  (app)/playlist/[id]/       queued optimistic edits
  (app)/favorites/           list morphs
  (app)/learn/               renders docs/*.md
  api/search/route.ts        JSON endpoint for SWR
features/
  track/                     track-queries.ts, track-actions.ts, components/
  playlist/                  playlist-queries.ts, playlist-actions.ts, components/
  search/                    use-search.ts, command palette
  learn/                     Markdown renderer
  user/                      the demo user
providers/                   player store + provider, playlist change queue
components/                  shared UI: sidebar, top bar, player bar, cover, skeleton helpers
lib/                         db, audio engine, cover art, small helpers
prisma/                      schema and seed
scripts/                     ensure-env.mjs (creates .env on a clean clone)
docs/                        the lessons (single source for /learn)
tests/                       Playwright specs
```

## Stack

Next.js 16.4 (App Router, Cache Components, Partial Prefetching) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 with SQLite · zod · SWR · Playwright.

Notes on versions:

- **Prisma is pinned to 7.x.** npm's `latest` tag currently points at an 8.0 release candidate.
- **`experimental.useOffline`** (lesson 06) is experimental in Next.js and not recommended for production.
- The APIs here were checked against the docs bundled in `node_modules/next/dist/docs/` for the installed version. When you upgrade Next.js, read those again.

## What is deliberately left out

To keep the focus on user experience patterns, this app has no authentication, no real audio hosting, no image pipeline, no `sitemap`/`robots`, and no deployment setup. The [checklist](./docs/checklist.md) says where each of those fits.
