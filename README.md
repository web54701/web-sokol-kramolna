# Sokol Kramolna — web

React 19 + TypeScript + Vite + Cloudflare Workers + D1

## Vývoj

```bash
npm install          # instalace závislostí
npm run dev          # Vite dev server (pouze frontend, bez API)
npm run preview      # build + lokální Worker s D1 (plný stack)
npm run build        # typová kontrola + produkční build
```

> Pro práci s rezervacemi a admin pohledem použij `npm run preview` — spustí Worker s lokální D1 databází.

## Databáze (Cloudflare D1)

```bash
# Jednorázové nastavení (nová instalace):
npm run db:setup          # vytvoří vzdálenou D1 databázi; zkopíruj database_id do wrangler.jsonc
npm run db:migrate        # nahraje schéma do vzdálené DB
npm run db:migrate:local  # nahraje schéma do lokální DB (pro npm run preview)

# Přímý přístup k datům:
npx wrangler d1 execute sokol-kramolna-db --remote --command "SELECT * FROM reservations"
npx wrangler d1 execute sokol-kramolna-db --local  --command "SELECT * FROM reservations"
```

## Deploy

```bash
npm run deploy       # build + deploy na Cloudflare Workers
```

Web běží na: **https://web-sokol-kramolna.web54701.workers.dev**

## Architektura

```
src/
  worker.ts                        # Cloudflare Worker — API handler
  features/reservation/
    ReservationFlow.tsx             # rezervační formulář (3 kroky)
    AdminView.tsx                   # správcovský pohled
    reservation.config.ts           # konfigurace módů (tenis / gym)
    date-utils.ts                   # pomocné funkce pro datum
migrations/
  0001_reservations.sql             # schéma D1 tabulky reservations
wrangler.jsonc                      # konfigurace Cloudflare Workers + D1
```

### API endpointy (`src/worker.ts`)

| Metoda | URL | Popis |
|--------|-----|-------|
| GET | `/api/reservations?activity=&from=&to=` | obsazené sloty pro dané období |
| POST | `/api/reservations` | vytvoření nové rezervace |
| DELETE | `/api/reservations/:id` | zrušení rezervace |

### Lokální vs. vzdálená databáze

`npm run dev` a `npm run preview` používají lokální SQLite v `.wrangler/state/v3/d1/` — nesdílí data se živým webem.
