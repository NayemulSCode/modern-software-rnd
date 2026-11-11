# 0001: One repository, independent studies

- **Date:** 2026-11-11
- **Status:** accepted

## Context

This repository is for studying many unrelated topics over a long time: architecture patterns, UI libraries, features, SEO, documentation. Studies will use different frameworks and different versions of the same framework. Some will be finished in a day and never touched again.

An R&D repository usually fails in one of two ways. Either it becomes a pile of half-finished folders that nobody, including the author, can read six months later. Or the tooling that holds it together becomes a project of its own.

## Decision

1. **One repository**, so all the knowledge is in one searchable place.
2. **Each study is an independent project** under `studies/<category>/<study>/`, with its own `package.json` and lockfile. There is no root workspace and no shared package.
3. **Every study uses the same README header**, including a written question, a status and a verdict.
4. **Every study exposes `npm run ci`.** The CI workflow runs that script, only in folders a change touched.
5. **Documentation is Markdown in the repository.** A documentation website is deferred and will itself be a study.

## Why

- **Independent over workspace.** A pnpm or Turborepo workspace hoists and aligns dependencies. That is the opposite of what a lab needs: one study pinned to an old version must not block another from trying a new one. Independence also means any study can be copied out and still run.
- **One repo over many.** Separate repositories isolate just as well, but scatter the notes and multiply the maintenance.
- **A required question and verdict.** The value of a study is the answer, not the code. Forcing both into the README is what keeps the repository readable later.
- **`npm run ci` as the only contract.** The workflow never needs to know what a study contains, so adding a study never means editing CI.
- **Markdown first.** It renders on GitHub with no tooling. Choosing a docs-site tool before studying the options would be guessing.

## Consequences

- Disk usage grows, because each study has its own `node_modules`. Delete `node_modules` in studies you are not working on.
- There is no code sharing between studies. Copying a helper from one study to another is expected and fine.
- Concluded studies go stale. That is accepted: each records a "Last verified" date, and automated dependency updates are left off.
- Monorepo tooling itself (workspaces, shared packages) can still be studied, inside a single study folder.

## Alternatives considered

- **Workspace monorepo for everything.** Rejected for the version-alignment reason above.
- **One repository per study, plus an index repository.** Rejected as too much overhead for one person.
