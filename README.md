# Sokol Kramolna — web

React 19 + TypeScript + Vite + Cloudflare Pages + D1 + R2

## Vývoj

```bash
npm install          # instalace závislostí
npm run dev          # Vite dev server s HMR — včetně API (Worker běží v miniflare)
npm run preview      # build + `wrangler pages dev` — reálné chování Cloudflare Pages
npm run build        # typová kontrola + produkční build do dist/
npm run lint         # ESLint
```

`npm run dev` je běžný režim práce: má HMR a zároveň funkční `/api` i `/media` proti
lokální D1 a R2. `npm run preview` použij před nasazením — spouští build přesně tak,
jak poběží na Pages (Functions + `_routes.json`), takže odhalí rozdíly proti dev režimu.

## Databáze (Cloudflare D1)

```bash
npm run db:migrate:local   # migrace do lokální DB
npm run db:migrate         # migrace do produkční DB

# Přímý přístup k datům:
npx wrangler d1 execute sokol-kramolna-db --remote --command "SELECT * FROM reservations"
npx wrangler d1 execute sokol-kramolna-db --local  --command "SELECT * FROM reservations"

# Preview (dřívější staging) databáze:
npx wrangler d1 execute sokol-kramolna-db-staging --env preview --remote --file=migrations/0009_revision_actions.sql
```

SQL s diakritikou posílej vždy přes `--file=`, ne přes `--command` (rozbila by se
znaková sada).

## Deploy

Produkce běží na **Cloudflare Pages** s napojením na Git:

| Větev | Prostředí | Databáze / bucket |
|-------|-----------|-------------------|
| `main` | produkce | `sokol-kramolna-db`, `sokol-kramolna-media` |
| ostatní | preview (vlastní URL) | `sokol-kramolna-db-staging`, `sokol-kramolna-media-staging` |

Nasazení = `git push`. Bindingy jsou ve `wrangler.jsonc` (Pages je čte odtud, v
dashboardu se editovat nedají); v dashboardu se nastavují jen **secrets** a
`NODE_VERSION`.

Cron Worker se nasazuje zvlášť:

```bash
npm run deploy:cron
```

## Architektura

```
functions/
  [[path]].ts                       # Pages Function — produkční API (celé /api a /media)
src/
  worker.ts                         # tenký Worker jen pro `npm run dev`
  server/
    router.ts                       # sdílený router API + rezervace, settings, blokace
    email.ts                        # Gmail API (potvrzovací maily) + Resend (alerty)
    auth.ts, users.ts               # přihlášení, session, správa uživatelů
    content.ts, media.ts            # CMS obsah a média v R2
  features/reservation/             # rezervační formulář a správcovský pohled
cron-worker/                        # samostatný Worker — měsíční kontrola Gmail tokenu
public/_routes.json                 # které cesty spouští Pages Function
wrangler.jsonc                      # konfigurace Pages (bindingy, prostředí)
wrangler.dev.jsonc                  # konfigurace jen pro lokální dev
migrations/                         # SQL migrace D1
```

Router je jeden a sdílený: v produkci ho volá `functions/[[path]].ts`, lokálně
`src/worker.ts`. Statické soubory Pages servíruje samo, Function se spouští jen
pro cesty z `public/_routes.json` (`/api/*` a `/media/*`). Neznámé cesty vrací
`index.html`, takže funguje SPA routing — proto v `dist/` nesmí vzniknout `404.html`.

Cloudflare Pages nepodporuje cron triggery, proto měsíční kontrola platnosti Gmail
refresh tokenu běží jako samostatný Worker v `cron-worker/` (nepotřebuje žádné
bindingy, jen secrets).

### API endpointy (`src/server/router.ts`)

| Metoda | URL | Popis |
|--------|-----|-------|
| POST | `/api/auth/login`, `/api/auth/logout` | přihlášení / odhlášení |
| GET | `/api/auth/me` | přihlášený uživatel |
| GET | `/api/content` | veřejný obsah CMS |
| GET/POST/PATCH/DELETE | `/api/admin/content[/:id]` | správa obsahu, `PUT /reorder`, `GET /revisions` |
| GET/POST/DELETE | `/api/admin/media[/:id]` | správa médií (R2) |
| GET | `/media/:key` | veřejný výdej médií z R2 |
| GET/POST/PATCH/DELETE | `/api/admin/users[/:id]` | správa uživatelů |
| GET | `/api/reservations?activity=&from=&to=` | obsazené sloty pro období |
| POST | `/api/reservations` | nová rezervace (odešle potvrzovací e-mail) |
| POST/PATCH/DELETE | `/api/reservations/:id` | potvrzení / úprava / zrušení |
| GET | `/api/reservations/confirm?token=`, `/cancel?token=` | odkazy z e-mailu |
| GET/PATCH | `/api/settings` | nastavení aktivity |
| GET/POST/PATCH/DELETE | `/api/blocked[/:id]` | blokované sloty |

### Secrets

`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `RESEND_API_KEY`,
`ALERT_EMAIL` — lokálně v `.dev.vars`, v produkci v dashboardu Pages projektu
(zvlášť pro Production i Preview) a u cron Workeru přes `wrangler secret put`.
Obnova Gmail tokenu viz [GMAIL.md](GMAIL.md).

### Lokální vs. vzdálená databáze

`npm run dev` i `npm run preview` používají lokální SQLite v `.wrangler/state/v3/d1/`
— nesdílí data se živým webem.
