# Roadmap

Ideas for studies, grouped by category and written as questions. Pick one, follow [how to add a study](./how-to-add-a-study.md), and tick it off when it is concluded.

This list is a backlog, not a promise. Reorder it freely, and delete ideas that stop being interesting.

## Architecture

- [x] How do you make a Next.js app feel as fast as a native app while still rendering on the server? → [next-app-like-ux](../studies/architecture/next-app-like-ux)
- [ ] Does a feature-sliced folder structure make a mid-size app easier to change than grouping by file type?
- [ ] What does a pnpm + Turborepo monorepo with a shared UI package cost to set up, and when does it pay off?
- [ ] How should authentication fit with Cache Components, where session data is request-time?
- [ ] Where is the line between server state (SWR / TanStack Query) and client state (Zustand, context), and what goes wrong when it is blurred?
- [ ] Micro-frontends with Module Federation: what problem do they solve that a monorepo does not?

## UI libraries

- [ ] Can shadcn/ui cover a data-heavy admin screen (table, filters, forms, dialogs) without custom components?
- [ ] **astryx.atmeta** — *confirm the exact name and link before starting.* What does it offer that shadcn/ui does not?
- [ ] Radix Primitives vs Base UI vs React Aria: which headless layer gives the best accessibility for the least code?
- [ ] How do you build and document your own small design system on top of Tailwind tokens?
- [ ] Copy-in components (shadcn) vs installed packages (MUI, Mantine): what is the real maintenance difference after six months?

Results from these belong side by side in [`comparisons/component-libraries.md`](./comparisons), using the same test screen for every library.

## Features

- [ ] Forms: what is the cleanest way to share one zod schema between client validation and a Server Action?
- [ ] Authentication: session cookies, OAuth and protected routes with the current Next.js model.
- [ ] Internationalisation: routing, translated content and right-to-left layout.
- [ ] Data tables: server-side sorting, filtering and pagination driven by the URL.
- [ ] File upload: progress, validation, and direct-to-storage uploads.
- [ ] Realtime: polling vs server-sent events vs WebSockets for a live feed.
- [ ] Role-based access control: where to check permissions, and how to keep the UI and server in agreement.

## SEO

- [ ] What does a page need so a shared link shows a rich preview in search results and chat apps? (metadata, Open Graph images, structured data)
- [ ] `sitemap.ts`, `robots.ts` and canonical URLs for a site with dynamic routes.
- [ ] How do rendering choices (static, cached, dynamic) change Core Web Vitals on a slow phone?
- [ ] How do you make content easy for AI assistants to find and quote?

## Documentation

- [ ] Which docs-site tool fits this repository: Fumadocs, Starlight, Docusaurus or Nextra? *(The winner becomes this repo's website and renders the existing Markdown.)*
- [ ] Storybook for a component library: what should a component's page contain for a developer and for a designer?
- [ ] User documentation vs developer documentation: what does each reader need, and how do you keep both current?
- [ ] Generating API reference from TypeScript types.
- [ ] Architecture decision records: do they stay useful, or go stale?

## Later categories

Not started, listed so they have a home when the time comes: `backend`, `databases`, `devops`, `testing`, `ai`.
