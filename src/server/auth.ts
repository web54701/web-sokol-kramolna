/// <reference types="@cloudflare/workers-types" />

import { verifyPassword } from './password.ts';

export interface AuthEnv {
  DB: D1Database;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

const COOKIE_NAME = 'sk_session';
const SESSION_DAYS = 30;
// Session se prodlužuje jen když jí zbývá méně než polovina platnosti (šetří zápisy).
const RENEW_THRESHOLD_MS = (SESSION_DAYS / 2) * 24 * 60 * 60 * 1000;

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

function sessionCookie(request: Request, token: string, maxAgeSeconds: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function expiryFromNow(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Ověří session cookie. Vrátí přihlášeného uživatele, nebo 401 Response.
 * U mutací (POST/PATCH/PUT/DELETE) navíc kontroluje hlavičku Origin (CSRF).
 */
export async function requireAuth(request: Request, env: AuthEnv): Promise<AuthUser | Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) {
      return json({ error: 'Forbidden' }, 403);
    }
  }

  const token = getCookie(request, COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    'SELECT s.token, s.expires_at, u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?'
  ).bind(token, now).first<{ token: string; expires_at: string; id: number; email: string; name: string }>();

  if (!row) return json({ error: 'Unauthorized' }, 401);

  if (new Date(row.expires_at).getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?')
      .bind(expiryFromNow(), token).run();
  }

  return { id: row.id, email: row.email, name: row.name };
}

export async function handleLogin(request: Request, env: AuthEnv): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Neplatný požadavek.' }, 400);
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) return json({ error: 'Zadejte e-mail a heslo.' }, 400);

  const user = await env.DB.prepare(
    'SELECT id, email, name, password_hash FROM users WHERE email = ?'
  ).bind(email).first<{ id: number; email: string; name: string; password_hash: string }>();

  const valid = user !== null && await verifyPassword(password, user.password_hash);
  if (!valid || !user) {
    // Zpomalení proti hádání hesel; stejná odpověď pro neznámý e-mail i špatné heslo.
    await new Promise(resolve => setTimeout(resolve, 500));
    return json({ error: 'Nesprávný e-mail nebo heslo.' }, 401);
  }

  const token = newToken();
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(token, user.id, now, expiryFromNow()),
    env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, user.id),
  ]);

  return json(
    { id: user.id, email: user.email, name: user.name },
    200,
    { 'Set-Cookie': sessionCookie(request, token, SESSION_DAYS * 24 * 60 * 60) },
  );
}

export async function handleLogout(request: Request, env: AuthEnv): Promise<Response> {
  const token = getCookie(request, COOKIE_NAME);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) });
}

export async function handleMe(request: Request, env: AuthEnv): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  return json(auth);
}
