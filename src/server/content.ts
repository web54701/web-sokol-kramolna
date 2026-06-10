/// <reference types="@cloudflare/workers-types" />

import { requireAuth, type AuthEnv } from './auth.ts';

const REVISIONS_KEPT = 20;
const MAX_DATA_BYTES = 64 * 1024;
const VISIBILITIES = ['all', 'desktop', 'mobile'];

interface ContentRow {
  id: number;
  zone: string;
  type: string;
  sort: number;
  hidden: number;
  visibility: string;
  data: string;
  updated_at: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function rowToObject(r: ContentRow) {
  return {
    id: r.id,
    zone: r.zone,
    type: r.type,
    sort: r.sort,
    hidden: r.hidden === 1,
    visibility: r.visibility,
    data: JSON.parse(r.data) as Record<string, unknown>,
  };
}

/** Strukturu `data` validují formuláře CMS; server hlídá jen typ a velikost. */
function validData(data: unknown): data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  return JSON.stringify(data).length <= MAX_DATA_BYTES;
}

export async function handleGetContent(env: AuthEnv): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM content_objects ORDER BY zone, sort, id'
    ).all<ContentRow>();
    return json(results.map(rowToObject));
  } catch {
    // Tabulka ještě neexistuje (neaplikovaná migrace) — frontend spadne na defaulty.
    return json([]);
  }
}

export async function handleCreateContent(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as { zone?: string; type?: string; data?: unknown; sort?: number };
  if (!body.zone || !body.type || !validData(body.data)) {
    return json({ error: 'Chybí zone, type nebo platná data.' }, 400);
  }

  let sort = body.sort;
  if (sort === undefined) {
    const row = await env.DB.prepare(
      'SELECT COALESCE(MAX(sort), -1) + 1 AS next FROM content_objects WHERE zone = ?'
    ).bind(body.zone).first<{ next: number }>();
    sort = row?.next ?? 0;
  }

  const result = await env.DB.prepare(
    'INSERT INTO content_objects (zone, type, sort, hidden, visibility, data, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)'
  ).bind(body.zone, body.type, sort, 'all', JSON.stringify(body.data), new Date().toISOString()).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

export async function handlePatchContent(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const id = parseInt(new URL(request.url).pathname.split('/').pop() ?? '', 10);
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const body = await request.json() as {
    data?: unknown;
    hidden?: boolean;
    visibility?: string;
    sort?: number;
  };

  const row = await env.DB.prepare('SELECT * FROM content_objects WHERE id = ?')
    .bind(id).first<ContentRow>();
  if (!row) return json({ error: 'Not found' }, 404);

  if (body.data !== undefined) {
    if (!validData(body.data)) return json({ error: 'Neplatná data.' }, 400);

    await env.DB.batch([
      env.DB.prepare('INSERT INTO content_revisions (object_id, data, saved_by, saved_at) VALUES (?, ?, ?, ?)')
        .bind(id, row.data, auth.email, new Date().toISOString()),
      env.DB.prepare(
        'DELETE FROM content_revisions WHERE object_id = ? AND id NOT IN (SELECT id FROM content_revisions WHERE object_id = ? ORDER BY id DESC LIMIT ?)'
      ).bind(id, id, REVISIONS_KEPT),
      env.DB.prepare('UPDATE content_objects SET data = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(body.data), new Date().toISOString(), id),
    ]);
  }

  if (body.hidden !== undefined) {
    await env.DB.prepare('UPDATE content_objects SET hidden = ?, updated_at = ? WHERE id = ?')
      .bind(body.hidden ? 1 : 0, new Date().toISOString(), id).run();
  }

  if (body.visibility !== undefined) {
    if (!VISIBILITIES.includes(body.visibility)) return json({ error: 'Neplatná viditelnost.' }, 400);
    await env.DB.prepare('UPDATE content_objects SET visibility = ?, updated_at = ? WHERE id = ?')
      .bind(body.visibility, new Date().toISOString(), id).run();
  }

  if (body.sort !== undefined) {
    await env.DB.prepare('UPDATE content_objects SET sort = ?, updated_at = ? WHERE id = ?')
      .bind(body.sort, new Date().toISOString(), id).run();
  }

  return json({ ok: true });
}

export async function handleDeleteContent(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const id = parseInt(new URL(request.url).pathname.split('/').pop() ?? '', 10);
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM content_revisions WHERE object_id = ?').bind(id),
    env.DB.prepare('DELETE FROM content_objects WHERE id = ?').bind(id),
  ]);
  return json({ ok: true });
}

export async function handleReorderContent(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as { zone?: string; ids?: number[] };
  if (!body.zone || !Array.isArray(body.ids) || body.ids.some(i => typeof i !== 'number')) {
    return json({ error: 'Chybí zone nebo ids.' }, 400);
  }

  const now = new Date().toISOString();
  await env.DB.batch(
    body.ids.map((objId, i) =>
      env.DB.prepare('UPDATE content_objects SET sort = ?, updated_at = ? WHERE id = ? AND zone = ?')
        .bind(i, now, objId, body.zone)
    )
  );
  return json({ ok: true });
}
