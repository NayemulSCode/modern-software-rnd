# mechinterp-blog

| | |
|---|---|
| **Question** | Can small in-browser models make mechanistic interpretability understandable to developers, and what does an interactive MDX blog that stays fast and accessible take in Next.js 16? |
| **Status** | `concluded` |
| **Category** | ai |
| **Stack** | Next.js 16.4.6 · React 19.3 · `@next/mdx` 16.4.6 · Tailwind CSS 4.3 + `@tailwindcss/typography` 0.5 · KaTeX 0.19 (`remark-math`, `rehype-katex`) · Shiki 4.6 (`rehype-pretty-code` 0.14) · Vitest 5.1 · no ML library |
| **Started** | 2026-11-12 |
| **Last verified** | 2026-11-12 |

**Short answer:** yes on both counts. The toy models were enough to show every idea the posts explain, and they reproduce the published behaviour at toy scale. The blog stays static and readable without JavaScript. It loads about 141 kB of compressed JavaScript per post, demo code arrives only when a reader scrolls near a demo (3–5 kB), and training runs in a Web Worker with no main-thread task over 50 ms. Getting there took several fixes that Next.js 16's defaults and suggestions did not make obvious (see Findings).

This is the first study in the `ai` category.

## How to run

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. Set `SITE_URL` to the public address before a production build, so RSS, the sitemap and share images use absolute URLs.

To check everything CI checks (lint, type-check, model tests, production build):

```bash
npm run ci
```

## What was built

A blog called *Inside the Model*: a four-part series on mechanistic interpretability for developers, with an index page, RSS, a sitemap, robots.txt, a share image per post and `TechArticle` JSON-LD.

| Post | Interactive demo |
|---|---|
| 1. What mechanistic interpretability is | A diagram of the residual stream (static SVG) |
| 2. Features and superposition | Train the 5-features-in-2-dimensions model from *Toy Models of Superposition* and change the sparsity |
| 3. Sparse autoencoders | Train an SAE on the activations from post 2 and change its L1 penalty |
| 4. Induction heads | A two-layer attention-only transformer with hand-written weights; ablate or patch each head |

```
app/
  page.tsx                       series index
  posts/[slug]/page.tsx          one post: MDX content, table of contents, series navigation, JSON-LD
  posts/[slug]/opengraph-image.tsx
  feed.xml/route.ts, sitemap.ts, robots.ts
content/posts/*.mdx              the posts; each exports `metadata`
mdx-components.tsx               links, tables, Callout, ResidualStreamDiagram
components/
  interactive/                   the three demos, the lazy-loading wrapper, the worker hook
  post/                          table of contents, callout, diagram
  theme-toggle.tsx
lib/
  toy/                           the models: superposition.ts, sae.ts, induction.ts, linalg.ts
  toy/train.worker.ts            trains a model off the main thread
  posts.ts, post-slugs.ts        post list, metadata, reading time, headings
proxy.ts                         real 404 status for unknown post URLs
tests/toy.test.ts                gradient checks and behaviour tests for every model
```

## Results

Measured on the production build (`next build`, `next start`) with Playwright and axe-core. The scripts follow the UI library studies.

| Check | Result |
|---|---|
| Automated checks | 67 of 67 pass, empty browser console; the dev server also runs clean |
| Posts readable without JavaScript | All 4: the article is visible and complete |
| JavaScript per post, compressed | 141 kB at load, the same on every post |
| Demo code, compressed | 3.1–5.3 kB, fetched only when the demo nears the viewport |
| Worker bundle | about 32 kB raw, fetched when training starts |
| CSS / fonts per post | 13 kB CSS; 52 kB fonts, or 105–114 kB on posts with maths (KaTeX fonts) |
| Training time | 1.0–1.5 s per run; 0 main-thread tasks over 50 ms while training |
| axe (WCAG 2.2 A/AA) | 0 violations on the home page and every post, light and dark, 1280 px and 390 px (20 states, demos open) |
| Keyboard | Every demo usable with the keyboard alone: sliders, radios, presets, "Show the numbers" |
| Reduced motion | Demos hold the last finished result instead of animating every step |
| SEO | RSS and sitemap list all posts; OG images return PNGs; unknown slugs return status 404 |
| Model tests | 14 pass, including finite-difference gradient checks |

For scale, a page of the [next-app-like-ux](../../architecture/next-app-like-ux) study on the same Next.js version ships 169 kB compressed, and the [shadcn/ui study](../../ui-libraries/shadcn-admin-screen) ships 261 kB.

## Findings

**About teaching with toy models**

- **The toy superposition model reproduces the paper's qualitative results.** With 5 features in 2 dimensions it stores 2 features when they are dense (like PCA), then 3, then 4 as two antipodal pairs, then all 5 as a pentagon at 97% sparsity. Unused features get a bias of about 0.5, their average value. Sparse features get a negative bias that filters interference. All of these match observations in *Toy Models of Superposition*, so the demo can be trusted to illustrate the text.
- **Hand-derived gradients are practical at this size, and the tests make them safe.** The models have 15 to 50 parameters. A finite-difference gradient check caught nothing after the first write, but it is the only reason to trust maths nobody else reviewed. Skipping an ML library saved about 1 MB of JavaScript.
- **Measure the toy before writing about it.** The SAE does not improve monotonically with λ (0.03 recovers all 5 features, 0.1 recovers 4), and "features recovered" can read 5 of 5 while the SAE barely fires (λ = 1). Both became teaching points. Neither would have been in the post if the text had been written from expectation.
- **Hand-written weights make causal experiments exact.** In the induction model, patching head 2.0 restores the prediction but patching head 1.0 does not, even though ablating either one breaks it. That contrast between "necessary" and "carries this difference" is the clearest lesson in the series. It only works because every weight has a known meaning.
- **Research claims needed primary sources, and the main ones are hard to fetch.** Anthropic's Transformer Circuits pages are 1–10 MB of HTML with embedded images, too large for automated fetching. The facts in the posts were checked against arXiv pages, a PDF text extraction, the authors' summary posts and secondary indexes, and each post cites its sources.

**About building it in Next.js 16**

- **MDX works with Turbopack when plugins are named as strings.** All five plugins used here (`remark-gfm`, `remark-math`, `rehype-slug`, `rehype-katex`, `rehype-pretty-code`) take plain JSON options, so they work. A plugin that needs a function option cannot be used with Turbopack yet.
- **Under Cache Components, `dynamicParams = false` no longer exists.** Unknown slugs render on request. A `notFound()` inside a streamed page can only send status 200 with a `noindex` tag. A real 404 status needs a check before the response starts: here, in `proxy.ts`.
- **The dev server's suggested fix for "instant" navigation hid the article from readers without JavaScript.** Development flags reading `params` outside `<Suspense>`. Wrapping it as suggested put the prerendered article in a hidden block that only JavaScript reveals: without JavaScript, only the fallback showed. Because every post is prerendered and unknown slugs 404 in the proxy, `export const instant = false` is the correct fix for this route. A first version of the no-JavaScript check missed this, because `innerText` also counts hidden text. The check now requires the article to be visible.
- **`ensureStatic = "navigation"` is a useful guard.** It makes the build fail if a post ever stops being fully static, for example after someone adds a request-time read.
- **File reads need `use cache` under Cache Components.** Reading time and the table of contents come from the MDX source on disk. The read is wrapped in a `use cache` function with `cacheLife("max")`.
- **Metadata objects are replaced, not merged.** A post's `alternates: { canonical }` silently removed the RSS link that the root layout's `alternates` declared. The post has to repeat it.
- **Web Workers bundle cleanly with Turbopack**, using `new Worker(new URL("…/train.worker.ts", import.meta.url), { type: "module" })`. The build also publishes the worker's raw `.ts` source under `/_next/static/media/`, which the browser never requests. That does not matter for an open-source study, but it would expose source in a private project.
- **Lazy islands keep posts static.** Each demo is a `next/dynamic` component with `ssr: false`, rendered only after an `IntersectionObserver` sees it within 400 px of the viewport. The server renders a placeholder of fixed height, so nothing shifts when the demo loads.

**About accessibility in a technical blog**

- **Shiki's `github-light` and `github-dark` themes fail WCAG contrast for comments** on a light and a dark page background. The `-high-contrast` variants pass.
- **Wide content creates scroll boxes that need keyboard access.** KaTeX display maths and Markdown tables scroll sideways at 390 px. axe flags each scroll box that cannot be focused. The fix: split long formulas into separate lines, and give the table wrapper `tabIndex={0}`, `role="region"` and a label.
- **The React lint rules shaped the code.** `react-hooks/refs` rejects reading refs during render, and `react-hooks/set-state-in-effect` rejects synchronous `setState` in effects. Reduced motion and the colour mode are both read with `useSyncExternalStore`, which satisfies both rules and avoids hydration mismatches.
- **Charts need a text twin.** Every demo has a live-region sentence that states the result, and a "Show the numbers" table with the plotted values. Colour is never the only signal: features are numbered and latents are lettered.

## Verdict

- **Use this approach when:** you want to explain a technical idea that has a small, checkable core: an algorithm, a data structure, a model. Static MDX plus lazy, worker-backed islands gives a page that is fast, readable without JavaScript, and interactive where it helps.
- **Avoid it when:** the idea only shows up at scale (real model behaviour, large datasets). A toy can mislead there, and precomputed results from the real system are more honest. Also avoid it if no one will maintain the maths: hand-written models need tests like the ones here.
- **Cost:** about 141 kB of compressed framework JavaScript per post. Several Next.js 16 behaviours had to be learned the hard way (instant validation, streaming status codes, metadata merging). Each research claim needs a primary source, which takes longer than writing the code.

## Open questions

- Would a real small model in the browser (for example GPT-2 small via an ONNX runtime) add enough to justify its size, compared with precomputed activations?
- Does the series actually teach? This study measured the site, not readers' understanding. A short quiz or a reader test would answer that.
- How much of the 141 kB is fixed by the framework? A post with no client components at all would show the floor.
- A docs-site study on the [roadmap](../../../docs/roadmap.md) could reuse this MDX setup and compare it with Fumadocs or Starlight.

## Sources

- Next.js docs bundled with the installed version: `node_modules/next/dist/docs/` (the MDX guide, `instant`, `ensureStatic`, route segment config, `proxy`, `loading` status codes, metadata files).
- The research cited in each post: Elhage et al. 2021 and 2022, Olah et al. 2020, Bricken et al. 2023, Templeton et al. 2024, Olsson et al. 2022, Wang et al. 2022, Meng et al. 2022, Ameisen et al. 2025.
- [axe-core](https://github.com/dequelabs/axe-core) for the accessibility scans, and [Playwright](https://playwright.dev) for the browser checks.
