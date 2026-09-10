import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Gare | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  location: string | null;
  starts_on: string;
  ends_on: string;
  competition_calls: { count: number }[];
  competition_results: { count: number }[];
};

export default async function GareListPage() {
  const org = await requirePermission("competitions.manage");
  const supabase = await createClient();

  const { data } = await supabase
    .from("competitions")
    .select(
      "id, name, location, starts_on, ends_on, competition_calls(count), competition_results(count)",
    )
    .eq("organization_id", org.organizationId)
    .order("starts_on", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="content">
      <PageHeader
        eyebrow="Attività agonistica"
        title="Gare"
        subtitle="Competizioni, convocazioni e risultati."
        action={{ href: "/gare/nuova", label: "Nuova gara" }}
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Gara" },
          { key: "location", label: "Luogo", render: (r) => r.location ?? "—" },
          {
            key: "dates",
            label: "Date",
            render: (r) =>
              r.starts_on === r.ends_on
                ? formatShortDate(`${r.starts_on}T12:00:00`)
                : `${formatShortDate(`${r.starts_on}T12:00:00`)} – ${formatShortDate(`${r.ends_on}T12:00:00`)}`,
          },
          {
            key: "calls",
            label: "Convocati",
            render: (r) => String(r.competition_calls?.[0]?.count ?? 0),
          },
          {
            key: "results",
            label: "Risultati",
            render: (r) => String(r.competition_results?.[0]?.count ?? 0),
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        rowHref={(r) => `/gare/${r.id}`}
        empty="Nessuna gara. Creane una con «Nuova gara»."
      />
    </div>
  );
}
