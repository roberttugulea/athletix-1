import { DataTable } from "@/components/ui/data-table";
import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createDiscipline } from "@/server/actions/config";
import { disciplineFields } from "../_fields";

export const metadata = { title: "Discipline | ATHLETIX" };

type Row = { id: string; name: string; color: string | null; active: boolean };

export default async function DisciplineListPage() {
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("disciplines")
    .select("id, name, color, active")
    .eq("organization_id", org.organizationId)
    .order("name");

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/impostazioni", label: "Impostazioni" }, { label: "Discipline" }]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Discipline"
        subtitle="Sport praticati nel centro. Si assegnano ai gruppi."
      />
      <DataTable<Row>
        columns={[
          {
            key: "name",
            label: "Nome",
            render: (r) => (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-[var(--line)]"
                  style={{ background: r.color ?? "transparent" }}
                />
                {r.name}
              </span>
            ),
          },
          { key: "color", label: "Colore" },
          {
            key: "active",
            label: "Stato",
            render: (r) => (r.active ? "Attiva" : "Disattivata"),
          },
        ]}
        rows={(data ?? []) as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/impostazioni/discipline/${r.id}`}
        empty="Nessuna disciplina."
      />
      <h2 className="mb-3 mt-8 text-sm font-bold">Nuova disciplina</h2>
      <EntityForm
        action={createDiscipline}
        fields={disciplineFields}
        defaults={{ active: true }}
        submitLabel="Crea disciplina"
      />
    </div>
  );
}
