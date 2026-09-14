/// <reference types="@cloudflare/workers-types" />

// Produkční API na Cloudflare Pages. Vyvolává se jen pro cesty
// uvedené v public/_routes.json (/api/* a /media/*).

import { routeRequest, type Env } from '../src/server/router.ts';

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await routeRequest(context.request, context.env, context);
  return response ?? context.next();
};
