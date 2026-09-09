import { DataTable } from "@/components/ui/data-table";
import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/validation/billing";
import { createFeePlan } from "@/server/actions/billing";
import { feePlanFields } from "../_fields";

export const metadata = { title: "Piani quota | ATHLETIX" };

type Row = {
  id: string;
  name: string;
  monthly_amount: number;
  due_day: number;
  active_from: string;
  active_to: string | null;
  seasons: { name: string } | null;
  groups: { name: string } | null;
};

export default async function PianiQuotaPage() {
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  const [{ data: plans }, { data: seasons }, { data: groups }] =
    await Promise.all([
      supabase
        .from("fee_plans")
        .select(
          "id, name, monthly_amount, due_day, active_from, active_to, seasons(name), groups(name)",
        )
        .eq("organization_id", org.organizationId)
        .order("name"),
      supabase
        .from("seasons")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("starts_on", { ascending: false }),
      supabase
        .from("groups")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .eq("active", true)
        .order("name"),
    ]);

  const missing = !seasons?.length;

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/abbonamenti", label: "Abbonamenti" },
          { label: "Piani quota" },
        ]}
      />
      <PageHeader
        eyebrow="Amministrazione"
        title="Piani quota mensile"
        subtitle="Importo ricorrente per gli iscritti a un gruppo."
      />
      <DataTable<Row>
        columns={[
          { key: "name", label: "Piano" },
          { key: "season", label: "Stagione", render: (r) => r.seasons?.name ?? "—" },
          { key: "group", label: "Gruppo", render: (r) => r.groups?.name ?? "—" },
          {
            key: "monthly_amount",
            label: "Importo",
            render: (r) => money(r.monthly_amount),
          },
          {
            key: "due_day",
            label: "Scadenza",
            render: (r) => `giorno ${r.due_day}`,
          },
        ]}
        rows={(plans ?? []) as unknown as Row[]}
        getKey={(r) => r.id}
        rowHref={(r) => `/abbonamenti/piani-quota/${r.id}`}
        empty="Nessun piano quota."
      />

      <h2 className="mb-3 mt-8 text-sm font-bold">Nuovo piano</h2>
      {missing ? (
        <p className="text-xs text-[var(--muted)]">
          Crea prima una stagione in Impostazioni → Stagioni.
        </p>
      ) : (
        <EntityForm
          action={createFeePlan}
          fields={feePlanFields(
            (seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
            (groups ?? []).map((g) => ({ value: g.id, label: g.name })),
          )}
          defaults={{ prorate_on_mid_month_join: true, due_day: 5 }}
          submitLabel="Crea piano"
        />
      )}
    </div>
  );
}
