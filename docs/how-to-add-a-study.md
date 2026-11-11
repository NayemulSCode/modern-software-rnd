# How to add a study

A study is a small, runnable project that answers one question. This page is the whole process.

## 1. Write the question

Before any code, write one sentence that ends in a question mark.

| Too vague | Good |
|---|---|
| "Try shadcn" | "Can shadcn/ui cover a data-heavy admin screen without writing custom components?" |
| "SEO stuff" | "What does a Next.js page need so a product link shows a rich preview in search and in chat apps?" |
| "Clean architecture" | "Does a feature-sliced folder structure make a mid-size app easier to change than grouping by file type?" |

If you cannot phrase it as a question, it is not ready. Add it to the [roadmap](./roadmap.md) and come back.

## 2. Pick the place

```
studies/<category>/<study-name>/
```

- **Category:** `architecture`, `ui-libraries`, `features`, `seo` or `documentation`. Create the folder if this is its first study. Add a new category only when nothing fits.
- **Name:** lowercase, hyphens, says what is studied: `shadcn-admin-table`, `next-structured-data`. Keep it short: Windows has a path length limit and `node_modules` paths get long.

## 3. Branch

```bash
git switch -c study/<category>-<study-name>
```

## 4. Scaffold and add the README

Create the project inside the folder with the tool's own generator. Then copy [`study-template.md`](./study-template.md) to the study's `README.md` and fill in the question, status `exploring`, stack and start date.

Every study must be **self-contained**:

- its own `package.json` and lockfile;
- its own `.gitignore` for build output;
- a committed `.env.example`, never a `.env`;
- no imports from other studies.

## 5. Add the `ci` script

Each study has one script that proves it still works. CI runs exactly this:

```json
{
  "scripts": {
    "ci": "npm run lint && npm run typecheck && npm run build"
  }
}
```

Include any setup the build needs (creating an env file, a database, a seed). It must pass from a clean clone with only `npm ci` run before it. See `studies/architecture/next-app-like-ux/package.json` for an example with a database.

## 6. Work, and commit as you go

Commit messages use [Conventional Commits](https://www.conventionalcommits.org) with the study name as the scope:

```
feat(shadcn-admin-table): add column sorting
fix(next-app-like-ux): close search dialog on first Escape
docs(shadcn-admin-table): record verdict
chore(repo): update CI workflow
```

Use `repo` as the scope for changes outside any study.

## 7. Conclude

A study is finished when the question has an answer, not when the code is perfect.

1. Fill in **Findings** and **Verdict** in the study's README.
2. Set the status to `concluded` and update **Last verified**.
3. Add or update the study's row in the root [`README.md`](../README.md).
4. Tick it off in the [roadmap](./roadmap.md).
5. If the result compares several options, add a table to [`comparisons/`](./comparisons).

## 8. Open a pull request

Open a pull request into `main` and paste the findings into the description. Squash-merge it. On a one-person repository this is still worth doing: every merged pull request becomes a dated, searchable record of one piece of research, and CI checks the study before it lands.

## Later

- **Graduate to a template.** If a concluded study is a good starting point for real projects, copy it to `templates/<name>/`, strip the experiment-specific parts, and give it a `ci` script too.
- **Revisit.** Concluded studies are snapshots and are not kept up to date. To refresh one, upgrade it on a branch, run `npm run ci`, and update **Last verified**. If it no longer runs and is not worth fixing, set the status to `archived` and say why.

## Where things go

| You have | It goes in |
|---|---|
| Code and notes for one question | `studies/<category>/<study>/` |
| A comparison across studies | `docs/comparisons/` |
| A choice about the repository itself | `docs/decisions/` |
| A reusable checklist | `docs/checklists/` |
| An idea for later | `docs/roadmap.md` |
| A starter you would copy into a real project | `templates/` |
