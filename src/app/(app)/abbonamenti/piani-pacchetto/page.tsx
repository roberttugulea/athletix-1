import { DataTable } from "@/components/ui/data-table";
import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/validation/billing";
import { createSubscriptionPlan } from "@/server/actions/billing";
import { subscriptionPlanFields } from "../_fields";

export const metadata = { title: "Piani pacchetto | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  active: boolean;
  disciplines: { name: string } | null;
};

export default async function PianiPacchettoPage() {
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  const [{ data: plans }, { data: disciplines }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("id, name, duration_months, price, active, disciplines(name)")
      .eq("organization_id", org.organizationId)
      .order("name"),
    supabase
      .from("disciplines")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .order("name"),
  ]);

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/abbonamenti", label: "Abbonamenti" },
          { label: "Piani pacchetto" },
        ]}
      />
      <PageHeader
        eyebrow="Amministrazione"
        title="Piani pacchetto"
        subtitle="Abbonamenti a durata fissa con prezzo unico."
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Pacchetto" },
          {
            key: "duration_months",
            label: "Durata",
            render: (r) => `${r.duration_months} mesi`,
          },
          { key: "price", label: "Prezzo", render: (r) => money(r.price) },
          {
            key: "discipline",
            label: "Disciplina",
            render: (r) => r.disciplines?.name ?? "—",
          },
          {
            key: "active",
            label: "Stato",
            render: (r) => (r.active ? "Attivo" : "Disattivato"),
          },
        ]}
        rows={(plans ?? []) as unknown as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/abbonamenti/piani-pacchetto/${r.id}`}
        empty="Nessun piano pacchetto."
      />

      <h2 className="mb-3 mt-8 text-sm font-bold">Nuovo pacchetto</h2>
      <EntityForm
        action={createSubscriptionPlan}
        fields={subscriptionPlanFields(
          (disciplines ?? []).map((d) => ({ value: d.id, label: d.name })),
        )}
        defaults={{ active: true, duration_months: 3 }}
        submitLabel="Crea pacchetto"
      />
    </div>
  );
}
