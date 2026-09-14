/// <reference types="@cloudflare/workers-types" />

// Odesílání e-mailů: Gmail API pro potvrzovací maily rezervací,
// Resend pro provozní alerty (výpadky, měsíční kontrola tokenu).

export interface AlertEnv {
  RESEND_API_KEY: string;
  ALERT_EMAIL: string;
}

export interface GmailEnv {
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
}

export interface EmailEnv extends GmailEnv {
  DB: D1Database;
}

/** Data rezervace pro sestavení e-mailu (strukturálně kompatibilní s ReservationBody). */
export interface ReservationEmailData {
  activity: string;
  date: string;
  hours: number[];
  name: string;
  email: string;
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

export async function sendAlert(env: AlertEnv, subject: string, message: string): Promise<void> {
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

async function getGmailAccessToken(env: GmailEnv): Promise<string> {
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
  return access_token;
}

async function sendGmailRaw(access_token: string, mime: string): Promise<void> {
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

type EmailTemplate = { subject: string; body: string };

// Fallback, kdyby šablony v DB chyběly (zóna email.templates) — drží se v synci se seedem.
const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  confirmation: {
    subject: 'Potvrzení rezervace – TJ Sokol Kramolna',
    body: 'Dobrý den, {name},\n\nVaše rezervace byla přijata. Níže najdete shrnutí a odkazy pro potvrzení nebo zrušení.\n\nAktivita: {activity}\nDatum:    {date}\nHodiny:   {hours}\nCena:     {price} Kč\nPlatba:   {payment}\n\n─────────────────────────────────────────\nPOTVRDIT REZERVACI:\n{confirmUrl}\n\nZRUŠIT REZERVACI:\n{cancelUrl}\n─────────────────────────────────────────\n\nS pozdravem,\nTJ Sokol Kramolna',
  },
  confirmed: {
    subject: 'Rezervace potvrzena – TJ Sokol Kramolna',
    body: 'Dobrý den, {name},\n\nVaše rezervace byla potvrzena. Níže najdete souhrn.\n\nAktivita: {activity}\nDatum:    {date}\nHodiny:   {hours}\nCena:     {price} Kč\nPlatba:   {payment}\n\n─────────────────────────────────────────\nZRUŠIT REZERVACI:\n{cancelUrl}\n─────────────────────────────────────────\n\nS pozdravem,\nTJ Sokol Kramolna',
  },
};

async function getEmailTemplate(env: EmailEnv, key: string): Promise<EmailTemplate> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT data FROM content_objects WHERE zone = 'email.templates'"
    ).all<{ data: string }>();
    for (const r of results) {
      const d = JSON.parse(r.data) as { key?: string; subject?: string; body?: string };
      if (d.key === key && d.subject && d.body) return { subject: d.subject, body: d.body };
    }
  } catch {
    // tabulka content_objects nemusí existovat — použije se fallback
  }
  return DEFAULT_EMAIL_TEMPLATES[key];
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

function buildEmailVars(body: ReservationEmailData, token: string, origin: string): Record<string, string> {
  return {
    name: body.name,
    activity: ACTIVITY_LABELS[body.activity] ?? body.activity,
    date: formatDate(body.date),
    hours: buildHoursFormatted(body.hours),
    price: String(body.price),
    payment: PAYMENT_LABELS[body.payment] ?? body.payment,
    confirmUrl: `${origin}/api/reservations/confirm?token=${token}`,
    cancelUrl: `${origin}/api/reservations/cancel?token=${token}`,
  };
}

function buildHoursFormatted(hours: number[]): string {
  const sortedHours = [...hours].sort((a, b) => a - b);
  const ranges: string[] = [];
  let i = 0;
  while (i < sortedHours.length) {
    let j = i;
    while (j + 1 < sortedHours.length && sortedHours[j + 1] === sortedHours[j] + 1) j++;
    ranges.push(`${sortedHours[i]}:00–${sortedHours[j] + 1}:00`);
    i = j + 1;
  }
  return ranges.join(', ');
}

export async function sendConfirmationEmail(
  env: EmailEnv,
  body: ReservationEmailData,
  token: string,
  origin: string,
): Promise<void> {
  const access_token = await getGmailAccessToken(env);
  const template = await getEmailTemplate(env, 'confirmation');
  const vars = buildEmailVars(body, token, origin);
  const emailBody = fillTemplate(template.body, vars);

  const mime = [
    `From: web54701@gmail.com`,
    `To: ${body.email}`,
    `Subject: ${encodeSubject(fillTemplate(template.subject, vars))}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    wrapLines(textToBase64(emailBody)),
  ].join('\r\n');

  await sendGmailRaw(access_token, mime);
}

export async function sendConfirmedEmail(
  env: EmailEnv,
  body: ReservationEmailData,
  token: string,
  origin: string,
): Promise<void> {
  const access_token = await getGmailAccessToken(env);
  const template = await getEmailTemplate(env, 'confirmed');
  const vars = buildEmailVars(body, token, origin);
  const emailBody = fillTemplate(template.body, vars);

  const mime = [
    `From: web54701@gmail.com`,
    `To: ${body.email}`,
    `Subject: ${encodeSubject(fillTemplate(template.subject, vars))}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    wrapLines(textToBase64(emailBody)),
  ].join('\r\n');

  await sendGmailRaw(access_token, mime);
}
