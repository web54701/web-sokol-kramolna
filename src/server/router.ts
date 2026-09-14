/// <reference types="@cloudflare/workers-types" />

// Společný router API. Používá ho jak produkční Pages Function
// (functions/[[path]].ts), tak lokální dev Worker (src/worker.ts).

import { handleLogin, handleLogout, handleMe } from './auth.ts';
import {
  handleGetContent,
  handleCreateContent,
  handlePatchContent,
  handleDeleteContent,
  handleReorderContent,
  handleListRevisions,
} from './content.ts';
import {
  handleGetUsers,
  handleCreateUser,
  handlePatchUser,
  handleDeleteUser,
} from './users.ts';
import {
  handleServeMedia,
  handleUploadMedia,
  handleListMedia,
  handleDeleteMedia,
} from './media.ts';
import {
  sendAlert,
  sendConfirmationEmail,
  sendConfirmedEmail,
} from './email.ts';

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
  RESEND_API_KEY: string;
  ALERT_EMAIL: string;
}

/** Minimum z ExecutionContext, které router potřebuje — má ho i PagesFunction context. */
export interface WaitUntilCtx {
  waitUntil(promise: Promise<unknown>): void;
}

interface ReservationRow {
  id: number;
  activity: string;
  date: string;
  hours: string;
  spots: number;
  name: string;
  email: string;
  phone: string;
  note: string;
  payment: string;
  price: number;
  created_at: string;
  cancel_token: string | null;
  confirmed_at: string | null;
}

interface ReservationBody {
  activity: string;
  date: string;
  hours: number[];
  spots?: number;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  payment: string;
  price: number;
}

interface AdminReservationBody {
  activity: string;
  date: string;
  hours: number[];
  spots?: number;
  name: string;
  email?: string;
  phone?: string;
  note?: string;
  payment: string;
  price: number;
}

const ACTIVITY_CAPACITY: Record<string, number> = { gym: 15 };

interface BlockedSlotRow {
  id: number;
  activity: string;
  type: string;
  dow: number | null;
  date: string | null;
  hours: string | null;
  note: string;
  note_public: number;
}

interface BlockedSlotBody {
  activity: string;
  type: 'recurring' | 'specific';
  dow?: number;
  date?: string;
  hours?: number[] | null;
  note?: string;
  note_public?: boolean;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function html(body: string, status = 200): Response {
  return new Response(`<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rezervace · TJ Sokol Kramolna</title><style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#222}p{font-size:1.1rem;line-height:1.6}</style></head><body><p>${body}</p></body></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
}

/** Text průvodce z CMS (zóna resv.texts) — pro návratové stránky z e-mailu. */
async function getUiText(env: Env, key: string, fallback: string): Promise<string> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT data FROM content_objects WHERE zone = 'resv.texts' AND hidden = 0"
    ).all<{ data: string }>();
    for (const r of results) {
      const d = JSON.parse(r.data) as { key?: string; text?: string };
      if (d.key === key && d.text) return d.text;
    }
  } catch {
    // tabulka content_objects nemusí existovat — použije se fallback
  }
  return fallback;
}

async function handleGetSettings(request: Request, env: Env): Promise<Response> {
  const activity = new URL(request.url).searchParams.get('activity');
  if (!activity) return json({ error: 'Missing activity' }, 400);

  const row = await env.DB.prepare(
    'SELECT email_verification FROM settings WHERE activity = ?'
  ).bind(activity).first<{ email_verification: number }>();

  if (!row) return json({ email_verification: true });
  return json({ email_verification: row.email_verification === 1 });
}

async function handlePatchSettings(request: Request, env: Env): Promise<Response> {
  const activity = new URL(request.url).searchParams.get('activity');
  if (!activity) return json({ error: 'Missing activity' }, 400);

  const body = await request.json() as { email_verification?: boolean };
  if (body.email_verification === undefined) return json({ error: 'Missing email_verification' }, 400);

  await env.DB.prepare(
    'INSERT INTO settings (activity, email_verification) VALUES (?, ?) ON CONFLICT(activity) DO UPDATE SET email_verification = excluded.email_verification'
  ).bind(activity, body.email_verification ? 1 : 0).run();

  return json({ ok: true });
}

async function handleGetReservations(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const activity = url.searchParams.get('activity');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!activity || !from || !to) {
    return json({ error: 'Missing parameters: activity, from, to' }, 400);
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM reservations WHERE activity = ? AND date >= ? AND date <= ? ORDER BY date, id'
  ).bind(activity, from, to).all<ReservationRow>();

  const reservations = results.map(r => ({ ...r, hours: JSON.parse(r.hours) as number[] }));
  return json(reservations);
}

async function handlePostReservation(
  request: Request,
  env: Env,
  ctx: WaitUntilCtx,
): Promise<Response> {
  const body = await request.json() as ReservationBody;
  const { activity, date, hours, name, email, payment, price } = body;

  if (!activity || !date || !hours?.length || !name || !email || !payment) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const { results: existing } = await env.DB.prepare(
    'SELECT hours, spots FROM reservations WHERE activity = ? AND date = ?'
  ).bind(activity, date).all<{ hours: string; spots: number }>();

  const capacity = ACTIVITY_CAPACITY[activity];
  if (capacity !== undefined) {
    const spotsPerHour = new Map<number, number>();
    for (const r of existing) {
      for (const h of JSON.parse(r.hours) as number[]) {
        spotsPerHour.set(h, (spotsPerHour.get(h) ?? 0) + (r.spots ?? 1));
      }
    }
    const requestedSpots = body.spots ?? 1;
    if (hours.some(h => (spotsPerHour.get(h) ?? 0) + requestedSpots > capacity)) {
      return json({ error: 'Vybraný termín byl mezitím obsazen.' }, 409);
    }
  } else {
    const takenHours = new Set<number>();
    for (const r of existing) {
      for (const h of JSON.parse(r.hours) as number[]) takenHours.add(h);
    }
    if (hours.some(h => takenHours.has(h))) {
      return json({ error: 'Vybraný termín byl mezitím obsazen.' }, 409);
    }
  }

  const token = crypto.randomUUID();

  await env.DB.prepare(
    'INSERT INTO reservations (activity, date, hours, spots, name, email, phone, note, payment, price, created_at, cancel_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    activity,
    date,
    JSON.stringify(hours),
    body.spots ?? 1,
    name,
    email,
    body.phone ?? '',
    body.note ?? '',
    payment,
    price,
    new Date().toISOString(),
    token,
  ).run();

  const settingsRow = await env.DB.prepare(
    'SELECT email_verification FROM settings WHERE activity = ?'
  ).bind(activity).first<{ email_verification: number }>();
  const emailVerification = settingsRow ? settingsRow.email_verification === 1 : true;

  const origin = new URL(request.url).origin;
  let emailSent = false;
  let emailError: unknown = null;

  if (emailVerification) {
    try {
      await sendConfirmationEmail(env, body, token, origin);
      emailSent = true;
    } catch (err) {
      emailError = err;
      console.error('Email send failed:', err);
    }

    if (!emailSent) {
      ctx.waitUntil(
        Promise.all([
          env.DB.prepare('UPDATE reservations SET confirmed_at = ? WHERE cancel_token = ?')
            .bind(new Date().toISOString(), token).run()
            .catch(dbErr => console.error('Auto-confirm failed:', dbErr)),
          sendAlert(
            env,
            'Sokol Kramolna: selhalo odesílání e-mailu',
            `Nepodařilo se odeslat potvrzovací e-mail zákazníkovi ${body.name} (${body.email}).\n\nReservace byla automaticky potvrzena.\n\nChyba: ${emailError}\n\nPravděpodobná příčina: expirovaný Gmail refresh token. Postup obnovy viz GMAIL.md.`,
          ).catch(alertErr => console.error('Alert send failed:', alertErr)),
        ])
      );
    }
  } else {
    ctx.waitUntil(
      env.DB.prepare('UPDATE reservations SET confirmed_at = ? WHERE cancel_token = ?')
        .bind(new Date().toISOString(), token).run()
        .catch(dbErr => console.error('Auto-confirm failed:', dbErr))
    );

    try {
      await sendConfirmedEmail(env, body, token, origin);
      emailSent = true;
    } catch (err) {
      console.error('Confirmed email send failed:', err);
    }
  }

  return json({ ok: true, emailSent, emailVerification }, 201);
}

async function handlePatchReservation(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : NaN;

  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const body = await request.json() as { hours?: number[]; name?: string; email?: string; phone?: string };
  const { hours, name, email, phone } = body;

  if (hours === undefined && name === undefined && email === undefined && phone === undefined) {
    return json({ error: 'Nothing to update' }, 400);
  }

  const row = await env.DB.prepare(
    'SELECT activity, date FROM reservations WHERE id = ?'
  ).bind(id).first<{ activity: string; date: string }>();

  if (!row) return json({ error: 'Not found' }, 404);

  if (hours !== undefined) {
    if (!Array.isArray(hours) || hours.length === 0) return json({ error: 'Invalid hours' }, 400);

    const { results: existing } = await env.DB.prepare(
      'SELECT hours FROM reservations WHERE activity = ? AND date = ? AND id != ?'
    ).bind(row.activity, row.date, id).all<{ hours: string }>();

    const takenHours = new Set<number>();
    for (const r of existing) {
      for (const h of JSON.parse(r.hours) as number[]) takenHours.add(h);
    }

    if (hours.some(h => takenHours.has(h))) {
      return json({ error: 'Vybraný termín koliduje s jinou rezervací.' }, 409);
    }

    await env.DB.prepare(
      'UPDATE reservations SET hours = ? WHERE id = ?'
    ).bind(JSON.stringify(hours), id).run();
  }

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) return json({ error: 'Jméno nesmí být prázdné.' }, 400);
    await env.DB.prepare('UPDATE reservations SET name = ? WHERE id = ?').bind(trimmed, id).run();
  }

  if (email !== undefined) {
    await env.DB.prepare('UPDATE reservations SET email = ? WHERE id = ?').bind(email.trim(), id).run();
  }

  if (phone !== undefined) {
    await env.DB.prepare('UPDATE reservations SET phone = ? WHERE id = ?').bind(phone.trim(), id).run();
  }

  return json({ ok: true });
}

async function handleAdminReservation(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as AdminReservationBody;
  const { activity, date, hours, name, payment, price } = body;

  if (!activity || !date || !hours?.length || !name || !payment) {
    return json({ error: 'Chybí povinné pole.' }, 400);
  }

  const { results: existing } = await env.DB.prepare(
    'SELECT hours, spots FROM reservations WHERE activity = ? AND date = ?'
  ).bind(activity, date).all<{ hours: string; spots: number }>();

  const capacity = ACTIVITY_CAPACITY[activity];
  if (capacity !== undefined) {
    const spotsPerHour = new Map<number, number>();
    for (const r of existing) {
      for (const h of JSON.parse(r.hours) as number[]) {
        spotsPerHour.set(h, (spotsPerHour.get(h) ?? 0) + (r.spots ?? 1));
      }
    }
    const requestedSpots = body.spots ?? 1;
    if (hours.some(h => (spotsPerHour.get(h) ?? 0) + requestedSpots > capacity)) {
      return json({ error: 'Vybraný termín je obsazen.' }, 409);
    }
  } else {
    const takenHours = new Set<number>();
    for (const r of existing) {
      for (const h of JSON.parse(r.hours) as number[]) takenHours.add(h);
    }
    if (hours.some(h => takenHours.has(h))) {
      return json({ error: 'Vybraný termín je obsazen.' }, 409);
    }
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    'INSERT INTO reservations (activity, date, hours, spots, name, email, phone, note, payment, price, created_at, confirmed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    activity, date, JSON.stringify(hours), body.spots ?? 1, name,
    body.email ?? '', body.phone ?? '', body.note ?? '',
    payment, price ?? 0, now, now,
  ).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

async function handleGetBlocked(request: Request, env: Env): Promise<Response> {
  const activity = new URL(request.url).searchParams.get('activity');
  if (!activity) return json({ error: 'Missing activity' }, 400);

  const { results } = await env.DB.prepare(
    'SELECT * FROM blocked_slots WHERE activity = ? ORDER BY type, dow, date'
  ).bind(activity).all<BlockedSlotRow>();

  const slots = results.map(r => ({
    ...r,
    hours: r.hours ? JSON.parse(r.hours) as number[] : null,
    note_public: r.note_public === 1,
  }));
  return json(slots);
}

async function handlePostBlocked(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as BlockedSlotBody;
  const { activity, type, dow, date, hours } = body;

  if (!activity || !type) return json({ error: 'Chybí activity nebo type.' }, 400);
  if (type === 'recurring' && dow === undefined) return json({ error: 'Chybí dow.' }, 400);
  if (type === 'specific' && !date) return json({ error: 'Chybí date.' }, 400);

  const result = await env.DB.prepare(
    'INSERT INTO blocked_slots (activity, type, dow, date, hours, note, note_public) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    activity, type,
    type === 'recurring' ? (dow ?? null) : null,
    type === 'specific' ? (date ?? null) : null,
    hours != null ? JSON.stringify(hours) : null,
    body.note ?? '',
    body.note_public ? 1 : 0,
  ).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

async function handlePatchBlocked(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : NaN;
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const body = await request.json() as BlockedSlotBody;
  const { type, dow, date, hours, note, note_public } = body;

  if (!type) return json({ error: 'Chybí type.' }, 400);

  await env.DB.prepare(
    'UPDATE blocked_slots SET type=?, dow=?, date=?, hours=?, note=?, note_public=? WHERE id=?'
  ).bind(
    type,
    type === 'recurring' ? (dow ?? null) : null,
    type === 'specific' ? (date ?? null) : null,
    hours != null ? JSON.stringify(hours) : null,
    note ?? '',
    note_public ? 1 : 0,
    id,
  ).run();

  return json({ ok: true });
}

async function handleDeleteBlocked(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : NaN;
  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  await env.DB.prepare('DELETE FROM blocked_slots WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

async function handleDeleteReservation(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : NaN;

  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const { success } = await env.DB.prepare(
    'DELETE FROM reservations WHERE id = ?'
  ).bind(id).run();

  return json({ ok: success });
}

async function handleAdminConfirm(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : NaN;

  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const result = await env.DB.prepare(
    'UPDATE reservations SET confirmed_at = ? WHERE id = ? AND confirmed_at IS NULL'
  ).bind(new Date().toISOString(), id).run();

  return json({ ok: result.meta.changes > 0 });
}

async function handleConfirmReservation(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return html(await getUiText(env, 'email_link_invalid', 'Neplatný odkaz.'), 400);

  const result = await env.DB.prepare(
    'UPDATE reservations SET confirmed_at = ? WHERE cancel_token = ? AND confirmed_at IS NULL'
  ).bind(new Date().toISOString(), token).run();

  if (result.meta.changes === 0) {
    const row = await env.DB.prepare(
      'SELECT confirmed_at FROM reservations WHERE cancel_token = ?'
    ).bind(token).first<{ confirmed_at: string | null }>();

    if (row?.confirmed_at) return html(await getUiText(env, 'email_confirm_already', 'Rezervace již byla potvrzena dříve. Děkujeme!'));
    return html(await getUiText(env, 'email_confirm_notfound', 'Rezervace nebyla nalezena nebo již neexistuje.'), 404);
  }

  return html(await getUiText(env, 'email_confirm_ok', 'Rezervace byla úspěšně potvrzena. Děkujeme!'));
}

async function handleCancelReservation(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return html(await getUiText(env, 'email_link_invalid', 'Neplatný odkaz.'), 400);

  const result = await env.DB.prepare(
    'DELETE FROM reservations WHERE cancel_token = ?'
  ).bind(token).run();

  if (result.meta.changes === 0) {
    return html(await getUiText(env, 'email_cancel_notfound', 'Rezervace nebyla nalezena nebo již byla zrušena.'), 404);
  }

  return html(await getUiText(env, 'email_cancel_ok', 'Rezervace byla úspěšně zrušena.'));
}

/**
 * Obslouží API cestu. Vrací null, pokud request žádné API routě neodpovídá —
 * volající pak servíruje statický obsah (Pages automaticky, dev Worker přes ASSETS).
 */
export async function routeRequest(
  request: Request,
  env: Env,
  ctx: WaitUntilCtx,
): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname, method } = { pathname: url.pathname, method: request.method };

  if (pathname === '/api/auth/login') {
    if (method === 'POST') return handleLogin(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/auth/logout') {
    if (method === 'POST') return handleLogout(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/auth/me') {
    if (method === 'GET') return handleMe(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname.startsWith('/media/')) {
    if (method === 'GET') return handleServeMedia(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/admin/media') {
    if (method === 'GET') return handleListMedia(request, env);
    if (method === 'POST') return handleUploadMedia(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname.startsWith('/api/admin/media/')) {
    if (method === 'DELETE') return handleDeleteMedia(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/admin/users') {
    if (method === 'GET') return handleGetUsers(request, env);
    if (method === 'POST') return handleCreateUser(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname.startsWith('/api/admin/users/')) {
    if (method === 'PATCH') return handlePatchUser(request, env);
    if (method === 'DELETE') return handleDeleteUser(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/content') {
    if (method === 'GET') return handleGetContent(env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/admin/content') {
    if (method === 'POST') return handleCreateContent(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/admin/content/reorder') {
    if (method === 'PUT') return handleReorderContent(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/admin/content/revisions') {
    if (method === 'GET') return handleListRevisions(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname.startsWith('/api/admin/content/')) {
    if (method === 'PATCH') return handlePatchContent(request, env);
    if (method === 'DELETE') return handleDeleteContent(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/reservations') {
    if (method === 'GET') return handleGetReservations(request, env);
    if (method === 'POST') return handlePostReservation(request, env, ctx);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/settings') {
    if (method === 'GET') return handleGetSettings(request, env);
    if (method === 'PATCH') return handlePatchSettings(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/blocked') {
    if (method === 'GET') return handleGetBlocked(request, env);
    if (method === 'POST') return handlePostBlocked(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname.startsWith('/api/blocked/')) {
    if (method === 'DELETE') return handleDeleteBlocked(request, env);
    if (method === 'PATCH') return handlePatchBlocked(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/reservations/admin') {
    if (method === 'POST') return handleAdminReservation(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/reservations/confirm') {
    if (method === 'GET') return handleConfirmReservation(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname === '/api/reservations/cancel') {
    if (method === 'GET') return handleCancelReservation(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (pathname.startsWith('/api/reservations/')) {
    if (method === 'DELETE') return handleDeleteReservation(request, env);
    if (method === 'POST') return handleAdminConfirm(request, env);
    if (method === 'PATCH') return handlePatchReservation(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  return null;
}
