# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server with HMR — includes the API (Worker runs in miniflare)
npm run build     # Type-check then build for production (output: dist/)
npm run lint      # Run ESLint across the codebase
npm run preview   # Build, then serve via `wrangler pages dev` (real Pages behaviour)
npm run deploy:cron  # Deploy the standalone cron Worker
```

There is no test runner configured. Deploying the site itself is `git push` — Cloudflare
Pages builds from Git (`main` = production, other branches = preview).

Commit messages are written in Czech, as is all user-facing copy.

## Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- `@vitejs/plugin-react` with Oxc transform (not Babel)
- **Cloudflare Pages** (static assets + Pages Functions), **D1** (SQLite), **R2** (media)
- ESLint flat config (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins
- TypeScript strict mode: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all enabled

## Architecture

A single-page React app with a CMS admin at `/admin` and a reservation system, backed by
an API that runs on Cloudflare's edge.

**Frontend** — no router library; view selection is local state. Calls the API with
relative paths (`/api/...`, `/media/...`) and `credentials: 'same-origin'`.

- [src/main.tsx](src/main.tsx) — entry point, mounts `<App />` via React 19's `createRoot`
- [src/admin/](src/admin/) — CMS admin (live editing, media picker, revisions)
- [src/content/ContentProvider.tsx](src/content/ContentProvider.tsx) — loads `/api/content`
- [src/features/reservation/](src/features/reservation/) — reservation flow and admin view

**Backend** — one shared router, two entry points:

- [src/server/router.ts](src/server/router.ts) — `routeRequest()` dispatches every `/api/*`
  and `/media/*` route and returns `null` when nothing matches (caller serves static assets).
  Also holds the reservation, settings and blocked-slot handlers.
- [functions/[[path]].ts](functions/) — **production**: Pages Function calling `routeRequest`
- [src/worker.ts](src/worker.ts) — **dev only**: thin Worker doing the same, run by
  `@cloudflare/vite-plugin` so HMR and the API work together
- [src/server/](src/server/) — `auth.ts` (cookie sessions in D1), `users.ts`, `content.ts`,
  `media.ts` (R2), `email.ts` (Gmail API for reservation mails, Resend for alerts),
  `password.ts` (PBKDF2 via WebCrypto)
- [cron-worker/](cron-worker/) — separate Worker for the monthly Gmail-token check;
  Pages Functions do not support cron triggers

Server code uses web-standard APIs only (no `node:` imports).

**Routing on Pages**: `public/_routes.json` lists the paths that invoke the Function
(`/api/*`, `/media/*`); everything else is served straight from static assets. Unmatched
paths fall back to `index.html`, which is what makes SPA deep links work — so never add a
`404.html` to the build output.

**Config**: `wrangler.jsonc` is the Pages config and the source of truth for bindings
(production at top level, preview under `env.preview`) — these cannot be edited in the
dashboard while the file exists. `wrangler.dev.jsonc` is used only by the dev plugin.
Secrets live in `.dev.vars` locally and in the Pages dashboard in production.

TypeScript is split into three configs: `tsconfig.app.json` (frontend), `tsconfig.node.json`
(vite config), and `tsconfig.worker.json` (server code — `src/worker.ts`, `src/server`,
`functions`, `cron-worker/src`). The root `tsconfig.json` references all three, so
`tsc -b` type-checks everything.

## Styling

All colors and typography are CSS custom properties defined in `index.css :root` (`--text`, `--bg`, `--accent`, `--border`, `--shadow`, `--sans`, `--mono`, etc.). Dark mode is handled entirely by a `@media (prefers-color-scheme: dark)` block that overrides those same variables — no class toggling. New UI should consume these tokens rather than hardcoding values.

Icons are rendered via an SVG sprite: `public/icons.svg` (served at `/icons.svg`). Reference individual icons with `<svg><use href="/icons.svg#icon-name" /></svg>`.

## ESLint

The current config uses type-unchecked rules. To enable stricter type-aware linting, replace `tseslint.configs.recommended` with `tseslint.configs.recommendedTypeChecked` or `strictTypeChecked` in [eslint.config.js](eslint.config.js) and add `parserOptions: { project: true }`.
