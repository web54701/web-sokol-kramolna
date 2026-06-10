/// <reference types="@cloudflare/workers-types" />

import { requireAuth, type AuthEnv } from './auth.ts';

export interface MediaEnv extends AuthEnv {
  MEDIA: R2Bucket;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** GET /media/:key — veřejný výdej. Klíče jsou UUID, obsah se pod klíčem nikdy nemění. */
export async function handleServeMedia(request: Request, env: MediaEnv): Promise<Response> {
  const key = new URL(request.url).pathname.slice('/media/'.length);
  if (!key) return new Response('Not Found', { status: 404 });

  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not Found', { status: 404 });

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': obj.httpEtag,
    },
  });
}

/** POST /api/admin/media — multipart upload (pole "file"). */
export async function handleUploadMedia(request: Request, env: MediaEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let file: File | null = null;
  try {
    const form = await request.formData();
    // workers-types typují FormData.get jako string; soubor přijde jako File.
    const entry = form.get('file') as unknown;
    if (entry instanceof File) file = entry;
  } catch {
    return json({ error: 'Neplatný požadavek (očekává se multipart/form-data).' }, 400);
  }

  if (!file) return json({ error: 'Chybí soubor.' }, 400);
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return json({ error: 'Nepodporovaný formát. Povolené: WebP, PNG, JPEG, SVG.' }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: 'Soubor je větší než 5 MB.' }, 400);

  const key = `${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });

  const result = await env.DB.prepare(
    'INSERT INTO media (key, filename, content_type, size, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(key, file.name, file.type, file.size, auth.email, new Date().toISOString()).run();

  return json({ ok: true, id: result.meta.last_row_id, key, url: `/media/${key}` }, 201);
}

export async function handleListMedia(request: Request, env: MediaEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { results } = await env.DB.prepare('SELECT * FROM media ORDER BY id DESC').all();
  return json(results);
}

export async function handleDeleteMedia(request: Request, env: MediaEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const id = parseInt(new URL(request.url).pathname.split('/').pop() ?? '', 10);
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const row = await env.DB.prepare('SELECT key FROM media WHERE id = ?').bind(id).first<{ key: string }>();
  if (!row) return json({ error: 'Not found' }, 404);

  await env.MEDIA.delete(row.key);
  await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
