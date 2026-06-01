/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

async function handlePostReservation(request: Request, env: Env): Promise<Response> {
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

  await env.DB.prepare(
    'INSERT INTO reservations (activity, date, hours, name, email, phone, note, payment, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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
  ).run();

  return json({ ok: true }, 201);
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    if (pathname === '/api/reservations') {
      if (method === 'GET') return handleGetReservations(request, env);
      if (method === 'POST') return handlePostReservation(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (pathname.startsWith('/api/reservations/')) {
      if (method === 'DELETE') return handleDeleteReservation(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
