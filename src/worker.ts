/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
  RESEND_API_KEY: string;
  ALERT_EMAIL: string;
}

interface ReservationRow {
  id: number;
  activity: string;
  date: string;
  hours: string;
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
  name: string;
  email: string;
  phone?: string;
  note?: string;
  payment: string;
  price: number;
}

const ACTIVITY_LABELS: Record<string, string> = {
  tenis: 'Tenis · Kurt 1 · antuka',
  gym: 'Posilovna · vstup',
};

const PAYMENT_LABELS: Record<string, string> = {
  hotove: 'Osobně při vrácení klíčů',
  prevod: 'Převodem na účet Sokola',
};

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

function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function encodeSubject(text: string): string {
  return `=?UTF-8?B?${textToBase64(text)}?=`;
}

function wrapLines(text: string, width = 76): string {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += width) lines.push(text.slice(i, i + width));
  return lines.join('\r\n');
}

function toBase64url(ascii: string): string {
  return btoa(ascii).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(day)}. ${parseInt(month)}. ${year}`;
}

async function sendAlert(env: Env, subject: string, message: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: [env.ALERT_EMAIL],
      subject,
      text: message,
    }),
  });
  if (!res.ok) throw new Error(`Resend API ${res.status}: ${await res.text()}`);
}

async function sendConfirmationEmail(
  env: Env,
  body: ReservationBody,
  token: string,
  origin: string,
): Promise<void> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  const { access_token } = await tokenRes.json<{ access_token: string }>();

  const sortedHours = [...body.hours].sort((a, b) => a - b);
  const ranges: string[] = [];
  let i = 0;
  while (i < sortedHours.length) {
    let j = i;
    while (j + 1 < sortedHours.length && sortedHours[j + 1] === sortedHours[j] + 1) j++;
    ranges.push(`${sortedHours[i]}:00–${sortedHours[j] + 1}:00`);
    i = j + 1;
  }
  const hoursFormatted = ranges.join(', ');

  const confirmUrl = `${origin}/api/reservations/confirm?token=${token}`;
  const cancelUrl = `${origin}/api/reservations/cancel?token=${token}`;

  const emailBody = [
    `Dobrý den, ${body.name},`,
    ``,
    `Vaše rezervace byla přijata. Níže najdete shrnutí a odkazy pro potvrzení nebo zrušení.`,
    ``,
    `Aktivita: ${ACTIVITY_LABELS[body.activity] ?? body.activity}`,
    `Datum:    ${formatDate(body.date)}`,
    `Hodiny:   ${hoursFormatted}`,
    `Cena:     ${body.price} Kč`,
    `Platba:   ${PAYMENT_LABELS[body.payment] ?? body.payment}`,
    ``,
    `─────────────────────────────────────────`,
    `POTVRDIT REZERVACI:`,
    confirmUrl,
    ``,
    `ZRUŠIT REZERVACI:`,
    cancelUrl,
    `─────────────────────────────────────────`,
    ``,
    `S pozdravem,`,
    `TJ Sokol Kramolna`,
  ].join('\n');

  const mime = [
    `From: web54701@gmail.com`,
    `To: ${body.email}`,
    `Subject: ${encodeSubject('Potvrzení rezervace – TJ Sokol Kramolna')}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    wrapLines(textToBase64(emailBody)),
  ].join('\r\n');

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: toBase64url(mime) }),
  });
  if (!sendRes.ok) throw new Error(`Gmail API failed: ${await sendRes.text()}`);
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
  ctx: ExecutionContext,
): Promise<Response> {
  const body = await request.json() as ReservationBody;
  const { activity, date, hours, name, email, payment, price } = body;

  if (!activity || !date || !hours?.length || !name || !email || !payment) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const { results: existing } = await env.DB.prepare(
    'SELECT hours FROM reservations WHERE activity = ? AND date = ?'
  ).bind(activity, date).all<{ hours: string }>();

  const takenHours = new Set<number>();
  for (const r of existing) {
    for (const h of JSON.parse(r.hours) as number[]) takenHours.add(h);
  }

  if (hours.some(h => takenHours.has(h))) {
    return json({ error: 'Vybraný termín byl mezitím obsazen.' }, 409);
  }

  const token = crypto.randomUUID();

  await env.DB.prepare(
    'INSERT INTO reservations (activity, date, hours, name, email, phone, note, payment, price, created_at, cancel_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    activity,
    date,
    JSON.stringify(hours),
    name,
    email,
    body.phone ?? '',
    body.note ?? '',
    payment,
    price,
    new Date().toISOString(),
    token,
  ).run();

  const origin = new URL(request.url).origin;
  let emailSent = false;
  let emailError: unknown = null;

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

  return json({ ok: true, emailSent }, 201);
}

async function handlePatchReservation(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : NaN;

  if (isNaN(id)) return json({ error: 'Invalid id' }, 400);

  const body = await request.json() as { hours?: number[] };
  const { hours } = body;

  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return json({ error: 'Missing or empty hours' }, 400);
  }

  const row = await env.DB.prepare(
    'SELECT activity, date FROM reservations WHERE id = ?'
  ).bind(id).first<{ activity: string; date: string }>();

  if (!row) return json({ error: 'Not found' }, 404);

  const { results: existing } = await env.DB.prepare(
    'SELECT id, hours FROM reservations WHERE activity = ? AND date = ? AND id != ?'
  ).bind(row.activity, row.date, id).all<{ id: number; hours: string }>();

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
  if (!token) return html('Neplatný odkaz.', 400);

  const result = await env.DB.prepare(
    'UPDATE reservations SET confirmed_at = ? WHERE cancel_token = ? AND confirmed_at IS NULL'
  ).bind(new Date().toISOString(), token).run();

  if (result.meta.changes === 0) {
    const row = await env.DB.prepare(
      'SELECT confirmed_at FROM reservations WHERE cancel_token = ?'
    ).bind(token).first<{ confirmed_at: string | null }>();

    if (row?.confirmed_at) return html('Rezervace již byla potvrzena dříve. Děkujeme!');
    return html('Rezervace nebyla nalezena nebo již neexistuje.', 404);
  }

  return html('Rezervace byla úspěšně potvrzena. Děkujeme!');
}

async function handleCancelReservation(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return html('Neplatný odkaz.', 400);

  const result = await env.DB.prepare(
    'DELETE FROM reservations WHERE cancel_token = ?'
  ).bind(token).run();

  if (result.meta.changes === 0) {
    return html('Rezervace nebyla nalezena nebo již byla zrušena.', 404);
  }

  return html('Rezervace byla úspěšně zrušena.');
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: env.GMAIL_CLIENT_ID,
          client_secret: env.GMAIL_CLIENT_SECRET,
          refresh_token: env.GMAIL_REFRESH_TOKEN,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Monthly token check failed:', err);
        await sendAlert(
          env,
          'Sokol Kramolna: Gmail token expiroval',
          `Měsíční ověření Gmail refresh tokenu selhalo.\n\nChyba: ${err}\n\nPostup obnovy viz GMAIL.md.`,
        ).catch(alertErr => console.error('Alert send failed:', alertErr));
      } else {
        await sendAlert(
          env,
          'Sokol Kramolna: Gmail token v pořádku',
          'Měsíční ověření Gmail refresh tokenu proběhlo úspěšně. Odesílání e-mailů funguje.',
        ).catch(alertErr => console.error('Alert send failed:', alertErr));
      }
    })());
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    if (pathname === '/api/reservations') {
      if (method === 'GET') return handleGetReservations(request, env);
      if (method === 'POST') return handlePostReservation(request, env, ctx);
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

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
