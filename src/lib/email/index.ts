import "server-only";

/**
 * Invio email transazionali via Resend (il provider più semplice da integrare).
 * Se `RESEND_API_KEY` / `EMAIL_FROM` non sono configurati, l'invio è saltato:
 * l'azione chiamante resta valida e registra comunque il record.
 */
export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped: boolean };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    return { ok: false, error: "Email non configurata", skipped: true };
  }

  const to = Array.isArray(opts.to) ? opts.to : [opts.to];
  if (to.length === 0) return { ok: false, error: "Nessun destinatario", skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: opts.subject,
        text: opts.text,
        ...(opts.html ? { html: opts.html } : {}),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        error: `Resend ${res.status}: ${body.slice(0, 200)}`,
        skipped: false,
      };
    }
    const json = (await res.json()) as { id: string };
    return { ok: true, id: json.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invio non riuscito",
      skipped: false,
    };
  }
}
