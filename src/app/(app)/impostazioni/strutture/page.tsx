import { DataTable } from "@/components/ui/data-table";
import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createFacility } from "@/server/actions/config";
import { facilityFields } from "../_fields";

export const metadata = { title: "Strutture | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  active: boolean;
};

export default async function StruttureListPage() {
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("facilities")
    .select("id, name, city, province, active")
    .eq("organization_id", org.organizationId)
    .order("name");

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/impostazioni", label: "Impostazioni" }, { label: "Strutture" }]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Strutture"
        subtitle="Sedi e impianti dell'organizzazione."
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Nome" },
          { key: "city", label: "Città" },
          { key: "province", label: "Prov." },
          {
            key: "active",
            label: "Stato",
            render: (r) => (r.active ? "Attiva" : "Disattivata"),
          },
        ]}
        rows={(data ?? []) as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/impostazioni/strutture/${r.id}`}
        empty="Nessuna struttura. Aggiungine una qui sotto."
      />
      <h2 className="mb-3 mt-8 text-sm font-bold">Nuova struttura</h2>
      <EntityForm
        action={createFacility}
        fields={facilityFields}
        defaults={{ active: true }}
        submitLabel="Crea struttura"
      />
    </div>
  );
}
