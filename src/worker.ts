/// <reference types="@cloudflare/workers-types" />

// Worker jen pro lokální vývoj (@cloudflare/vite-plugin — `npm run dev`).
// Produkce běží na Cloudflare Pages: statiku servíruje Pages,
// API obsluhuje functions/[[path]].ts nad stejným routerem.

import { routeRequest, type Env } from './server/router.ts';

interface WorkerEnv extends Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const response = await routeRequest(request, env, ctx);
    return response ?? env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
