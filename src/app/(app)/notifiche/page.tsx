import { PageHeader } from "@/components/ui/page-header";
import {
  NotificationsList,
  type NotificationRow,
} from "@/components/notifications-list";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notifiche | ATHLETIX" };

export default async function NotifichePage() {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, url, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="content">
      <PageHeader
        eyebrow="Aggiornamenti"
        title="Notifiche"
        subtitle="Scadenze documenti, comunicazioni e avvisi."
      />
      <NotificationsList rows={(data ?? []) as NotificationRow[]} />
    </div>
  );
}
