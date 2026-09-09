import { DataTable } from "@/components/ui/data-table";
import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createSeason } from "@/server/actions/config";
import { seasonFields } from "../_fields";

export const metadata = { title: "Stagioni | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  is_current: boolean;
};

export default async function StagioniListPage() {
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("id, name, starts_on, ends_on, is_current")
    .eq("organization_id", org.organizationId)
    .order("starts_on", { ascending: false });

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/impostazioni", label: "Impostazioni" }, { label: "Stagioni" }]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Stagioni"
        subtitle="Annate sportive. Una sola può essere quella corrente."
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Nome" },
          { key: "starts_on", label: "Inizio" },
          { key: "ends_on", label: "Fine" },
          {
            key: "is_current",
            label: "Corrente",
            render: (r) => (r.is_current ? "Sì" : ""),
          },
        ]}
        rows={(data ?? []) as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/impostazioni/stagioni/${r.id}`}
        empty="Nessuna stagione."
      />
      <h2 className="mb-3 mt-8 text-sm font-bold">Nuova stagione</h2>
      <EntityForm
        action={createSeason}
        fields={seasonFields}
        defaults={{ is_current: false }}
        submitLabel="Crea stagione"
      />
    </div>
  );
}
