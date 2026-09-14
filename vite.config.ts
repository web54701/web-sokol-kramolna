import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// Cloudflare plugin běží jen v dev režimu — spouští src/worker.ts v miniflare,
// takže /api a /media fungují lokálně proti D1/R2. Produkční build musí zůstat
// čistě statický, API tam obsluhují Pages Functions (functions/[[path]].ts).
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'serve' ? [cloudflare({ configPath: './wrangler.dev.jsonc' })] : [])],
}))
