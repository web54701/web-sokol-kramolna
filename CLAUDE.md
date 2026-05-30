# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check then build for production (output: dist/)
npm run lint      # Run ESLint across the codebase
npm run preview   # Serve the production build locally
```

There is no test runner configured.

## Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- `@vitejs/plugin-react` with Oxc transform (not Babel)
- ESLint flat config (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins
- TypeScript strict mode: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all enabled

## Architecture

This is a minimal single-page app with no routing, no global state library, and no backend integration.

- [src/main.tsx](src/main.tsx) — entry point, mounts `<App />` via React 19's `createRoot`
- [src/App.tsx](src/App.tsx) — single root component, uses `useState` for local state
- [src/App.css](src/App.css) — component styles using CSS nesting
- [src/index.css](src/index.css) — global styles with CSS custom properties and `prefers-color-scheme` dark mode

TypeScript is split into two configs: `tsconfig.app.json` (source, targets ES2023/ESNext) and `tsconfig.node.json` (vite config only). The root `tsconfig.json` references both.

## Styling

All colors and typography are CSS custom properties defined in `index.css :root` (`--text`, `--bg`, `--accent`, `--border`, `--shadow`, `--sans`, `--mono`, etc.). Dark mode is handled entirely by a `@media (prefers-color-scheme: dark)` block that overrides those same variables — no class toggling. New UI should consume these tokens rather than hardcoding values.

Icons are rendered via an SVG sprite: `public/icons.svg` (served at `/icons.svg`). Reference individual icons with `<svg><use href="/icons.svg#icon-name" /></svg>`.

## ESLint

The current config uses type-unchecked rules. To enable stricter type-aware linting, replace `tseslint.configs.recommended` with `tseslint.configs.recommendedTypeChecked` or `strictTypeChecked` in [eslint.config.js](eslint.config.js) and add `parserOptions: { project: true }`.
