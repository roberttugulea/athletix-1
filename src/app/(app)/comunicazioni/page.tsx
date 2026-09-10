import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  CHANNEL_LABEL,
  COMM_STATUS_LABEL,
} from "@/lib/validation/communications";

export const metadata = { title: "Comunicazioni | ATHLETIX" };

type Row = {
  id: string;
  title: string;
  channel: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  communication_recipients: { count: number }[];
};

export default async function ComunicazioniPage() {
  const org = await requirePermission("communications.manage");
  const supabase = await createClient();

  const { data } = await supabase
    .from("communications")
    .select(
      "id, title, channel, status, sent_at, created_at, communication_recipients(count)",
    )
    .eq("organization_id", org.organizationId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="content">
      <PageHeader
        eyebrow="Comunicazione"
        title="Comunicazioni"
        subtitle="Avvisi a staff, atleti e tutori. Sempre nel feed in-app; via email se scelto."
        action={{ href: "/comunicazioni/nuova", label: "Nuova comunicazione" }}
      />
      <DataTable<Row>
        columns={[
          { key: "title", label: "Oggetto" },
          {
            key: "channel",
            label: "Canale",
            render: (r) => CHANNEL_LABEL[r.channel] ?? r.channel,
          },
          {
            key: "recipients",
            label: "Destinatari",
            render: (r) => String(r.communication_recipients?.[0]?.count ?? 0),
          },
          {
            key: "status",
            label: "Stato",
            render: (r) => COMM_STATUS_LABEL[r.status] ?? r.status,
          },
          {
            key: "sent_at",
            label: "Inviata",
            render: (r) =>
              r.sent_at ? formatShortDate(r.sent_at) : "—",
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        rowHref={(r) => `/comunicazioni/${r.id}`}
        empty="Nessuna comunicazione. Creane una con «Nuova comunicazione»."
      />
    </div>
  );
}
