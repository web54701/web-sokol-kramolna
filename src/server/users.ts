/// <reference types="@cloudflare/workers-types" />

import { requireAuth, type AuthEnv } from './auth.ts';
import { hashPassword } from './password.ts';

const MIN_PASSWORD_LENGTH = 8;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function handleGetUsers(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { results } = await env.DB.prepare(
    'SELECT id, email, name, created_at, last_login_at FROM users ORDER BY email'
  ).all();
  return json(results);
}

export async function handleCreateUser(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as { email?: string; password?: string; name?: string };
  const email = body.email?.trim();
  if (!email || !email.includes('@')) return json({ error: 'Zadejte platný e-mail.' }, 400);
  if (!body.password || body.password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.` }, 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return json({ error: 'Uživatel s tímto e-mailem už existuje.' }, 409);

  const hash = await hashPassword(body.password);
  const result = await env.DB.prepare(
    'INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).bind(email, body.name?.trim() ?? '', hash, new Date().toISOString()).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

export async function handlePatchUser(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const id = parseInt(new URL(request.url).pathname.split('/').pop() ?? '', 10);
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const body = await request.json() as { name?: string; password?: string };

  if (body.name !== undefined) {
    await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(body.name.trim(), id).run();
  }

  if (body.password !== undefined) {
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      return json({ error: `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.` }, 400);
    }
    const hash = await hashPassword(body.password);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, id),
      // Změna hesla zneplatní všechny sessions uživatele.
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    ]);
  }

  return json({ ok: true });
}

export async function handleDeleteUser(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const id = parseInt(new URL(request.url).pathname.split('/').pop() ?? '', 10);
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  if (id === auth.id) return json({ error: 'Nemůžete smazat svůj vlastní účet.' }, 400);

  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>();
  if ((count?.n ?? 0) <= 1) return json({ error: 'Nelze smazat posledního uživatele.' }, 400);

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
