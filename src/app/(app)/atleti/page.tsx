import { DataTable } from "@/components/ui/data-table";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Atleti | ATHLETIX" };

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Attivo",
  inactive: "Inattivo",
  archived: "Archiviato",
};

export default async function AtletiListPage(props: {
  searchParams: Promise<{ q?: string; stato?: string }>;
}) {
  const { q, stato = "attivi" } = await props.searchParams;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  let query = supabase
    .from("athletes")
    .select("id, first_name, last_name, birth_date, status")
    .eq("organization_id", org.organizationId)
    .order("last_name")
    .order("first_name");

  if (stato === "archiviati") query = query.eq("status", "archived");
  else if (stato !== "tutti") query = query.in("status", ["active", "inactive"]);

  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim();
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,tax_code.ilike.%${term}%`,
    );
  }

  const { data } = await query;

  return (
    <div className="content">
      <PageHeader
        eyebrow="Anagrafica"
        title="Atleti"
        subtitle="Iscritti e clienti dell'organizzazione."
        action={{ href: "/atleti/nuovo", label: "Nuovo atleta" }}
      />
      <ListToolbar
        q={q}
        filters={[
          {
            name: "stato",
            value: stato,
            options: [
              { value: "attivi", label: "Attivi" },
              { value: "archiviati", label: "Archiviati" },
              { value: "tutti", label: "Tutti" },
            ],
          },
        ]}
      />
      <DataTable<Row>
        columns={[
          {
            key: "name",
            label: "Atleta",
            render: (r) => `${r.last_name} ${r.first_name}`,
          },
          { key: "birth_date", label: "Nascita" },
          {
            key: "status",
            label: "Stato",
            render: (r) => STATUS_LABEL[r.status] ?? r.status,
          },
        ]}
        rows={(data ?? []) as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/atleti/${r.id}`}
        empty={
          term
            ? "Nessun atleta corrisponde alla ricerca."
            : "Nessun atleta. Aggiungine uno con «Nuovo atleta»."
        }
      />
    </div>
  );
}
