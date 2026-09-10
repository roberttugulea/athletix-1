import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Eventi | ATHLETIX" };

type Row = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  facilities: { name: string } | null;
};

export default async function EventiListPage() {
  const org = await requirePermission("competitions.manage");
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, facilities(name)")
    .eq("organization_id", org.organizationId)
    .order("starts_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="content">
      <PageHeader
        eyebrow="Organizzazione"
        title="Eventi"
        subtitle="Feste, riunioni, stage e attività non agonistiche."
        action={{ href: "/eventi/nuovo", label: "Nuovo evento" }}
      />
      <DataTable<Row>
        columns={[
          { key: "title", label: "Evento" },
          {
            key: "when",
            label: "Quando",
            render: (r) =>
              `${formatShortDate(r.starts_at)} ${formatTime(r.starts_at)}–${formatTime(r.ends_at)}`,
          },
          {
            key: "facility",
            label: "Struttura",
            render: (r) => r.facilities?.name ?? "—",
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        rowHref={(r) => `/eventi/${r.id}`}
        empty="Nessun evento. Creane uno con «Nuovo evento»."
      />
    </div>
  );
}
