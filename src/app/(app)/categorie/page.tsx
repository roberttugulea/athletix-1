import { DataTable } from "@/components/ui/data-table";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { KIND_LABEL } from "@/lib/validation/categories";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Categorie | ATHLETIX" };

type Row = {
  id: string;
  kind: string;
  name: string;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  active: boolean;
  disciplines: { name: string } | null;
};

function range(r: Row): string {
  if (r.min_value == null && r.max_value == null) return "—";
  const u = r.unit ? ` ${r.unit}` : "";
  if (r.min_value != null && r.max_value != null)
    return `${r.min_value}–${r.max_value}${u}`;
  if (r.min_value != null) return `≥ ${r.min_value}${u}`;
  return `≤ ${r.max_value}${u}`;
}

export default async function CategorieListPage(props: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q, tipo = "" } = await props.searchParams;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  let query = supabase
    .from("categories")
    .select("id, kind, name, min_value, max_value, unit, active, disciplines(name)")
    .eq("organization_id", org.organizationId)
    .order("kind")
    .order("name");

  if (tipo) query = query.eq("kind", tipo);
  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim();
  if (term) query = query.ilike("name", `%${term}%`);

  const { data } = await query;

  return (
    <div className="content">
      <PageHeader
        eyebrow="Anagrafica"
        title="Categorie"
        subtitle="Fasce di età, peso, livello o disciplina da assegnare agli atleti."
        action={{ href: "/categorie/nuovo", label: "Nuova categoria" }}
      />
      <ListToolbar
        q={q}
        filters={[
          {
            name: "tipo",
            value: tipo,
            options: [
              { value: "", label: "Tutti i tipi" },
              { value: "age", label: "Età" },
              { value: "weight", label: "Peso" },
              { value: "level", label: "Livello" },
              { value: "discipline", label: "Disciplina" },
              { value: "other", label: "Altro" },
            ],
          },
        ]}
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Nome" },
          {
            key: "kind",
            label: "Tipo",
            render: (r) => KIND_LABEL[r.kind] ?? r.kind,
          },
          { key: "range", label: "Intervallo", render: range },
          {
            key: "discipline",
            label: "Disciplina",
            render: (r) => r.disciplines?.name ?? "—",
          },
          {
            key: "active",
            label: "Stato",
            render: (r) => (r.active ? "Attiva" : "Disattivata"),
          },
        ]}
        rows={(data ?? []) as unknown as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/categorie/${r.id}`}
        empty={
          term
            ? "Nessuna categoria corrisponde alla ricerca."
            : "Nessuna categoria. Creane una con «Nuova categoria»."
        }
      />
    </div>
  );
}
