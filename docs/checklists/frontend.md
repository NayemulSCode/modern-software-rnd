# The frontend checklist

What to remember when you configure and build a Next.js app. Each item is a habit, with the reason behind it.

> This is the living copy for the whole repository: add to it whenever a study teaches a new habit. It started in the [next-app-like-ux](../../studies/architecture/next-app-like-ux) study, and file paths in parentheses (for example `lib/db.ts`) refer to that study.

## 1. Before you write a component

- [ ] **Read the docs that ship with your version.** `node_modules/next/dist/docs/` matches exactly what you installed. Blog posts and AI answers can be a version behind.
- [ ] **Turn on the flags that enforce good structure.**

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};
```

- [ ] **TypeScript in `strict` mode.** Use the generated `PageProps<"/track/[id]">` and `LayoutProps<"/">` helpers for route props.
- [ ] **Validate environment variables at startup** and fail with a clear message (`lib/db.ts`). Commit a `.env.example`, never `.env`.
- [ ] **Know the public prefix.** Only variables starting with `NEXT_PUBLIC_` reach the browser, and they are visible to everyone. Secrets never get that prefix.

## 2. Project structure

- [ ] **Group by feature, not by file type.** `features/track/` holds its queries, actions, types and components together. `components/` is only for pieces shared across features.
- [ ] **Keep `app/` thin.** Route files compose; logic lives in `features/` and `lib/`.
- [ ] **Separate reads from writes.** `*-queries.ts` (server-only, cached) and `*-actions.ts` (`'use server'`).
- [ ] **Mark server code.** `import "server-only"` at the top of anything that touches the database or secrets. An accidental import from client code then fails the build instead of leaking.

## 3. Server or client

- [ ] **Server Component by default.** Add `'use client'` to the smallest leaf that needs state, effects or event handlers.
- [ ] **Never `'use client'` on a page or layout** just to use one hook.
- [ ] **Pass Server Components as `children`** to client providers so they stay on the server.
- [ ] **Only serializable props cross the boundary.** Plain objects, arrays, strings, numbers. No functions, class instances or ORM models.
- [ ] **No browser APIs during render.** `window`, `localStorage`, `AudioContext` belong in effects or event handlers.

→ [The mental model](../../studies/architecture/next-app-like-ux/docs/00-mental-model.md), [Client interactivity](../../studies/architecture/next-app-like-ux/docs/04-client-interactivity.md)

## 4. Data

- [ ] **For every read, decide: static, cached or dynamic.**
- [ ] **Cached reads get `'use cache'`, a `cacheLife` and a `cacheTag`.**
- [ ] **Everything that changes the result is a function argument**, including the user id.
- [ ] **Dynamic reads sit inside `<Suspense>`.**
- [ ] **Fetch in parallel.** `Promise.all`, or sibling components. Avoid one `await` after another.
- [ ] **Select only the columns you render.** Less data from the database, less data over the network.
- [ ] **Fetch on the client only when the browser must drive it**, and use SWR or TanStack Query.

→ [Caching](../../studies/architecture/next-app-like-ux/docs/02-caching.md), [Streaming](../../studies/architecture/next-app-like-ux/docs/07-streaming.md), [Fetching on the client](../../studies/architecture/next-app-like-ux/docs/10-client-fetching.md)

## 5. Navigation

- [ ] **`<Link>` for every internal link.** Never `<a href>` for app routes.
- [ ] **Pages return Suspense boundaries without awaiting.** Do not `await params` at the top of a page.
- [ ] **Each page has its own boundary.** A layout's boundary does not cover navigation between its children.
- [ ] **`prefetch={true}` only where it pays for itself.** For long lists, upgrade on hover.
- [ ] **Judge speed with `next build && next start`**, never with `next dev`.

→ [Instant navigation](../../studies/architecture/next-app-like-ux/docs/01-instant-navigation.md), [Prefetching](../../studies/architecture/next-app-like-ux/docs/03-prefetching.md)

## 6. Loading, empty and error states

Every piece of async UI has four states. Design all of them.

- [ ] **Loading:** a skeleton with the same size and layout as the real content.
- [ ] **Empty:** say what is missing and what to do next (see the Favorites page with no favorites).
- [ ] **Error:** an `error.tsx` per section, so one failure does not blank the whole app. Offer a retry.
- [ ] **Not found:** call `notFound()` and provide a `not-found.tsx`.
- [ ] **Success:** the easy one.

## 7. Mutations

- [ ] **Treat every Server Action and Route Handler as a public API.** Validate input (zod), find the user on the server, check permission against the database.
- [ ] **Return errors, do not throw them**, so the UI can show a precise message (`lib/result.ts`).
- [ ] **Expire every tag that shows the changed data.**
- [ ] **Give instant feedback** with `useOptimistic` inside a transition, and explain rollbacks.
- [ ] **Queue edits that can overlap** with `useActionState`.
- [ ] **Make multi-row writes atomic** with a database transaction.

→ [Revalidation](../../studies/architecture/next-app-like-ux/docs/05-revalidation.md), [Optimistic updates](../../studies/architecture/next-app-like-ux/docs/08-optimistic-updates.md), [Queued mutations](../../studies/architecture/next-app-like-ux/docs/09-queued-mutations.md)

## 8. Performance: the three numbers

| Metric | Means | Good | Main levers |
|---|---|---|---|
| **LCP** Largest Contentful Paint | How soon the main content shows | ≤ 2.5s | Static shell, caching, `next/image` with `priority` on the hero, `next/font` |
| **CLS** Cumulative Layout Shift | How much the page jumps | ≤ 0.1 | Matching skeletons, image `width`/`height`, nested Suspense |
| **INP** Interaction to Next Paint | How fast it reacts to input | ≤ 200ms | Less client JS, transitions, optimistic UI, narrow subscriptions |

- [ ] **Fonts through `next/font`.** Self-hosted, no layout shift (`app/layout.tsx`).
- [ ] **Images through `next/image`** with real dimensions and a meaningful `alt`. Tempo has no image files at all: covers are CSS gradients (`lib/cover-art.ts`).
- [ ] **Watch the bundle.** Every `'use client'` file and everything it imports ships to the browser. Import heavy libraries only in the leaf that needs them, or load them with `next/dynamic`.
- [ ] **Subscribe narrowly.** Fast-changing state should re-render only the component that shows it.
- [ ] **Measure on a slow phone profile**, not on your development machine.

## 9. Accessibility

- [ ] **Semantic HTML first.** `<button>` for actions, `<a>`/`<Link>` for navigation, `<nav>`, `<main>`, `<header>`, lists for lists. A `<div onClick>` is neither focusable nor announced.
- [ ] **Every control has a name.** Icon-only buttons need `aria-label`; decorative icons get `aria-hidden`.
- [ ] **Expose state.** `aria-pressed` on toggles, `aria-current="page"` on the active nav link, `aria-expanded` on disclosures.
- [ ] **Keyboard works everywhere.** Tab through the whole app without a mouse. Focus is always visible.
- [ ] **Use native elements for hard widgets.** `<dialog>` and the `popover` attribute give focus management and Escape for free.
- [ ] **Announce async changes.** `role="status"` for the offline bar, `role="alert"` for errors.
- [ ] **Contrast of at least 4.5:1** for body text.
- [ ] **Respect `prefers-reduced-motion`.**
- [ ] **One `<h1>` per page**, headings in order, `lang` on `<html>`.

## 10. Metadata and SEO

- [ ] **`metadata` in the root layout** with a title template: `"%s · Tempo"`.
- [ ] **`generateMetadata` for dynamic routes**, reusing the page's cached query so it costs nothing extra.
- [ ] **A real `description`** per important page.
- [ ] **Open Graph image, `sitemap.ts`, `robots.ts`** before going public. Not included in this learning app.

## 11. Styling

- [ ] **Design tokens in one place.** Colours, fonts and animation timings are defined once in `app/globals.css` under `@theme`, then used through utilities.
- [ ] **Mobile first.** Write the small-screen layout, then add `sm:` / `lg:` variants. Test at 375px wide.
- [ ] **`min-w-0` on flex and grid children that contain text**, or `truncate` will not work.
- [ ] **Touch targets at least 36–44px.**
- [ ] **Use the platform.** `dvh` units, `text-balance`, `:has()`, `popover`, `<dialog>` replace a lot of JavaScript.

## 12. Motion

- [ ] **Animate to explain a change**, not to decorate.
- [ ] **150–300ms.** Longer feels slow.
- [ ] **Fixed elements stay fixed** during page transitions.
- [ ] **`pointer-events: none` on `::view-transition`** so the page stays clickable.

→ [View Transitions](../../studies/architecture/next-app-like-ux/docs/11-view-transitions.md)

## 13. Security

- [ ] **Validate on the server, always.** Client validation is only for convenience.
- [ ] **Never trust ids, roles or prices sent by the client.**
- [ ] **No secrets in client code or `NEXT_PUBLIC_` variables.**
- [ ] **`dangerouslySetInnerHTML` only with content you control**, or sanitize it first (`app/(app)/learn/[slug]/page.tsx` renders this repo's own Markdown).
- [ ] **Never build a file path from user input.** The lesson renderer only reads slugs found in a fixed list.
- [ ] **`rel="noreferrer"` on external links** opened in a new tab.

## 14. Before you ship

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run build
```

```bash
npm test
```

- [ ] Read the route table from `next build`. Is each route as static as you expected?
- [ ] Click through the app on the production build with the network throttled to "Slow 4G".
- [ ] Run Lighthouse on the main pages.
- [ ] Tab through every page with the keyboard.
- [ ] Check 375px, 768px and 1440px widths.
- [ ] Turn on reduced motion and check again.
- [ ] Look at the browser console. It should be empty.

Lessons behind these items start at [the mental model](../../studies/architecture/next-app-like-ux/docs/00-mental-model.md).
