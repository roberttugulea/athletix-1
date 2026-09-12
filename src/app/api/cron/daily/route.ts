import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Job giornaliero (Vercel Cron, vedi `vercel.json`): aggiorna gli stati delle
 * quote scadute su tutte le organizzazioni e genera le notifiche per i
 * documenti in scadenza. Gira con la chiave di servizio, senza sessione
 * utente — protetto da `CRON_SECRET` (Vercel lo invia come Bearer token
 * quando la variabile d'ambiente è configurata sul progetto).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const admin = createAdminClient();

  const fees = await admin.rpc("refresh_monthly_fee_statuses", {
    p_organization_id: undefined,
  });
  const alerts = await admin.rpc("notify_expiring_documents");

  return NextResponse.json({
    ok: !fees.error && !alerts.error,
    ranAt: new Date().toISOString(),
    feeStatuses: { error: fees.error?.message ?? null },
    documentAlerts: {
      notificationsCreated: alerts.data ?? null,
      error: alerts.error?.message ?? null,
    },
  });
}
