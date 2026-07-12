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

type RevisionAction = 'update' | 'create' | 'delete' | 'hide' | 'show';

/**
 * Příkazy pro zápis revize + prořez historie objektu — vkládat do DB.batch.
 * `data` je snímek stavu objektu v okamžiku události (u update stav před úpravou).
 */
function revisionStatements(
  env: AuthEnv, objectId: number, zone: string, type: string,
  action: RevisionAction, data: string, email: string,
): D1PreparedStatement[] {
  return [
    env.DB.prepare(
      'INSERT INTO content_revisions (object_id, data, saved_by, saved_at, zone, type, action) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(objectId, data, email, new Date().toISOString(), zone, type, action),
    env.DB.prepare(
      'DELETE FROM content_revisions WHERE object_id = ? AND id NOT IN (SELECT id FROM content_revisions WHERE object_id = ? ORDER BY id DESC LIMIT ?)'
    ).bind(objectId, objectId, REVISIONS_KEPT),
  ];
}

interface RevisionRow {
  id: number;
  object_id: number;
  data: string;
  saved_by: string;
  saved_at: string;
  zone: string;
  type: string;
  action: string;
  current_data: string | null;
  current_hidden: number | null;
}

export async function handleListRevisions(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    // LEFT JOIN: revize smazaných objektů zůstávají vidět (current_data = null).
    const { results } = await env.DB.prepare(
      `SELECT r.id, r.object_id, r.data, r.saved_by, r.saved_at,
              r.zone, r.type, r.action,
              o.data AS current_data, o.hidden AS current_hidden
       FROM content_revisions r
       LEFT JOIN content_objects o ON o.id = r.object_id
       ORDER BY r.id DESC
       LIMIT 100`
    ).all<RevisionRow>();
    return json(results.map((r) => ({
      id: r.id,
      objectId: r.object_id,
      zone: r.zone,
      type: r.type,
      action: r.action,
      savedBy: r.saved_by,
      savedAt: r.saved_at,
      data: JSON.parse(r.data) as Record<string, unknown>,
      currentData: r.current_data === null ? null : JSON.parse(r.current_data) as Record<string, unknown>,
      currentHidden: r.current_hidden === null ? null : r.current_hidden === 1,
    })));
  } catch {
    // Tabulka ještě neexistuje (neaplikovaná migrace).
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

  const dataJson = JSON.stringify(body.data);
  const result = await env.DB.prepare(
    'INSERT INTO content_objects (zone, type, sort, hidden, visibility, data, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)'
  ).bind(body.zone, body.type, sort, 'all', dataJson, new Date().toISOString()).run();

  const newId = result.meta.last_row_id;
  await env.DB.batch(revisionStatements(env, newId, body.zone, body.type, 'create', dataJson, auth.email));

  return json({ ok: true, id: newId }, 201);
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

  // Snímek dat pro případný zápis hide/show revize ve stejném požadavku.
  let currentDataJson = row.data;

  if (body.data !== undefined) {
    if (!validData(body.data)) return json({ error: 'Neplatná data.' }, 400);

    const dataJson = JSON.stringify(body.data);
    // Uložení beze změny nevytváří revizi.
    if (dataJson !== row.data) {
      await env.DB.batch([
        ...revisionStatements(env, id, row.zone, row.type, 'update', row.data, auth.email),
        env.DB.prepare('UPDATE content_objects SET data = ?, updated_at = ? WHERE id = ?')
          .bind(dataJson, new Date().toISOString(), id),
      ]);
      currentDataJson = dataJson;
    }
  }

  if (body.hidden !== undefined && (body.hidden ? 1 : 0) !== row.hidden) {
    await env.DB.batch([
      ...revisionStatements(env, id, row.zone, row.type, body.hidden ? 'hide' : 'show', currentDataJson, auth.email),
      env.DB.prepare('UPDATE content_objects SET hidden = ?, updated_at = ? WHERE id = ?')
        .bind(body.hidden ? 1 : 0, new Date().toISOString(), id),
    ]);
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

  const row = await env.DB.prepare('SELECT * FROM content_objects WHERE id = ?')
    .bind(id).first<ContentRow>();
  if (!row) return json({ error: 'Not found' }, 404);

  // Revize zůstávají — smazaný prvek jde z historie obnovit.
  await env.DB.batch([
    ...revisionStatements(env, id, row.zone, row.type, 'delete', row.data, auth.email),
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
