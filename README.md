# Modern Software R&D

A working notebook of small, runnable studies in modern software development: architecture, UI libraries, common features, SEO and documentation.

Each study answers **one written question**, runs on its own, and ends with a **verdict**. The goal is not a collection of demos. It is a record of what was tried, what was learned, and what is worth using in a real project.

## Studies

| Study | Category | Question | Status | Last verified |
|---|---|---|---|---|
| [next-app-like-ux](./studies/architecture/next-app-like-ux) | Architecture | How do you make a Next.js app feel as fast as a native app while still rendering on the server? | concluded | 2026-11-11 |

Status is one of `exploring`, `working`, `concluded` or `archived`. What is planned next is in the [roadmap](./docs/roadmap.md).

## How the repository is organised

```
studies/<category>/<study>/   one self-contained project per question
templates/<name>/             studies that became copy-ready starters
docs/                         knowledge that spans more than one study
  roadmap.md                  what to study next
  how-to-add-a-study.md       the conventions, step by step
  study-template.md           the README every study starts from
  decisions/                  why the repo is the way it is
  comparisons/                side-by-side results across studies
  checklists/                 reusable checklists
```

Categories so far: `architecture`, `ui-libraries`, `features`, `seo`, `documentation`. A category folder appears when its first study does.

## Run a study

Every study is independent. There is nothing to install at the root.

```bash
cd studies/architecture/next-app-like-ux
```

```bash
npm install
```

Then follow the "How to run" section of that study's README. To check that a study still works end to end, every study provides the same command:

```bash
npm run ci
```

## The rules

1. **One question per study**, written at the top of its README.
2. **Self-contained.** Own `package.json`, own lockfile, own `.env.example`. No shared workspace, so studies can use different frameworks and versions.
3. **Same README header everywhere**: question, status, stack and versions, last verified, how to run, findings, verdict, sources.
4. **`npm run ci` proves it works.** CI runs only that, and only for the studies a change touched.
5. **This README is the index.** A study that is not in the table above does not exist.
6. **Concluded studies are snapshots.** They are not kept up to date. "Last verified" says how old they are.
7. **Cross-study knowledge goes in `docs/`**, not inside one study.

The full version is in [how to add a study](./docs/how-to-add-a-study.md). The reasons are in [decision 0001](./docs/decisions/0001-repo-structure.md).

## License

[MIT](./LICENSE). Use anything here in your own projects.
