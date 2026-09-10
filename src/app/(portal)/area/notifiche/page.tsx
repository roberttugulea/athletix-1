import Link from "next/link";

import {
  NotificationsList,
  type NotificationRow,
} from "@/components/notifications-list";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notifiche | ATHLETIX" };

export default async function AreaNotifichePage() {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, url, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = ((data ?? []) as NotificationRow[]).map((n) =>
    n.url && n.url.startsWith("/notifiche")
      ? { ...n, url: n.url.replace("/notifiche", "/area/notifiche") }
      : n,
  );

  return (
    <div>
      <Link href="/area" className="text-xs text-[var(--blue)]">
        ← Area personale
      </Link>
      <h1 className="mt-2 mb-1 text-xl font-bold">Notifiche</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Comunicazioni della società e promemoria.
      </p>
      <NotificationsList rows={rows} />
    </div>
  );
}
