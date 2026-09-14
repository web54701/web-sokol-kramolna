/// <reference types="@cloudflare/workers-types" />

// Měsíční kontrola platnosti Gmail refresh tokenu.
// Běží samostatně, protože Cloudflare Pages cron triggery nepodporuje.

import { sendAlert, type AlertEnv, type GmailEnv } from '../../src/server/email.ts';

interface CronEnv extends AlertEnv, GmailEnv {}

export default {
  async scheduled(_controller: ScheduledController, env: CronEnv, ctx: ExecutionContext): Promise<void> {
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
} satisfies ExportedHandler<CronEnv>;
