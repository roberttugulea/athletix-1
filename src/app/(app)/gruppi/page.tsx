import { DataTable } from "@/components/ui/data-table";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Gruppi | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  capacity: number | null;
  active: boolean;
  facilities: { name: string } | null;
  seasons: { name: string } | null;
  disciplines: { name: string } | null;
};

export default async function GruppiListPage(props: {
  searchParams: Promise<{ q?: string; stagione?: string }>;
}) {
  const { q, stagione = "" } = await props.searchParams;
  const org = await requirePermission("groups.manage");
  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("organization_id", org.organizationId)
    .order("starts_on", { ascending: false });

  let query = supabase
    .from("groups")
    .select(
      "id, name, capacity, active, season_id, facilities(name), seasons(name), disciplines(name)",
    )
    .eq("organization_id", org.organizationId)
    .order("name");

  if (stagione) query = query.eq("season_id", stagione);

  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim();
  if (term) query = query.ilike("name", `%${term}%`);

  const { data } = await query;

  return (
    <div className="content">
      <PageHeader
        eyebrow="Struttura sportiva"
        title="Gruppi"
        subtitle="Corsi e squadre: struttura, stagione, disciplina e capienza."
        action={{ href: "/gruppi/nuovo", label: "Nuovo gruppo" }}
      />
      <ListToolbar
        q={q}
        filters={[
          {
            name: "stagione",
            value: stagione,
            options: [
              { value: "", label: "Tutte le stagioni" },
              ...(seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
            ],
          },
        ]}
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Gruppo" },
          {
            key: "facility",
            label: "Struttura",
            render: (r) => r.facilities?.name ?? "—",
          },
          {
            key: "season",
            label: "Stagione",
            render: (r) => r.seasons?.name ?? "—",
          },
          {
            key: "discipline",
            label: "Disciplina",
            render: (r) => r.disciplines?.name ?? "—",
          },
          {
            key: "capacity",
            label: "Capienza",
            render: (r) => (r.capacity == null ? "—" : String(r.capacity)),
          },
          {
            key: "active",
            label: "Stato",
            render: (r) => (r.active ? "Attivo" : "Disattivato"),
          },
        ]}
        rows={(data ?? []) as unknown as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/gruppi/${r.id}`}
        empty={
          term
            ? "Nessun gruppo corrisponde alla ricerca."
            : "Nessun gruppo. Creane uno con «Nuovo gruppo»."
        }
      />
    </div>
  );
}
