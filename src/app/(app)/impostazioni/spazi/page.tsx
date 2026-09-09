import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createSpace } from "@/server/actions/config";
import { spaceFields } from "../_fields";

export const metadata = { title: "Spazi | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  capacity: number | null;
  active: boolean;
  facility_id: string;
  facilityName: string;
};

export default async function SpaziListPage() {
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();

  const [{ data: spaces }, { data: facilities }] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, name, capacity, active, facility_id")
      .eq("organization_id", org.organizationId)
      .order("name"),
    supabase
      .from("facilities")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .eq("active", true)
      .order("name"),
  ]);

  const facilityName = new Map((facilities ?? []).map((f) => [f.id, f.name]));
  const rows: Row[] = (spaces ?? []).map((s) => ({
    ...s,
    facilityName: facilityName.get(s.facility_id) ?? "—",
  }));

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/impostazioni", label: "Impostazioni" }, { label: "Spazi" }]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Spazi"
        subtitle="Palestre, campi e sale associati alle strutture."
      />

      {(facilities ?? []).length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-icon">◦</span>
            <p>
              Crea prima almeno una struttura in{" "}
              <Link className="text-[var(--blue)]" href="/impostazioni/strutture">
                Strutture
              </Link>
              .
            </p>
          </div>
        </div>
      ) : (
        <>
          <DataTable<Row>
            columns={[
              { key: "name", label: "Nome" },
              { key: "facilityName", label: "Struttura" },
              { key: "capacity", label: "Capienza" },
              {
                key: "active",
                label: "Stato",
                render: (r) => (r.active ? "Attivo" : "Disattivato"),
              },
            ]}
            rows={rows}
            getKey={(r) => r.id}
            rowHref={(r) => `/impostazioni/spazi/${r.id}`}
            empty="Nessuno spazio."
          />
          <h2 className="mb-3 mt-8 text-sm font-bold">Nuovo spazio</h2>
          <EntityForm
            action={createSpace}
            fields={spaceFields(
              (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
            )}
            defaults={{ active: true }}
            submitLabel="Crea spazio"
          />
        </>
      )}
    </div>
  );
}
