import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { generateFees, updateFeePlan } from "@/server/actions/billing";
import { feePlanFields } from "../../_fields";

export const metadata = { title: "Piano quota | ATHLETIX" };

export default async function PianoQuotaEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  const [{ data: row }, { data: seasons }, { data: groups }] = await Promise.all(
    [
      supabase
        .from("fee_plans")
        .select(
          "id, name, season_id, group_id, monthly_amount, due_day, prorate_on_mid_month_join, active_from, active_to",
        )
        .eq("organization_id", org.organizationId)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("seasons")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("starts_on", { ascending: false }),
      supabase
        .from("groups")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("name"),
    ],
  );

  if (!row) notFound();
  const thisMonth = todayISO().slice(0, 7);

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/abbonamenti", label: "Abbonamenti" },
          { href: "/abbonamenti/piani-quota", label: "Piani quota" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Amministrazione" title={row.name} />

      <EntityForm
        action={updateFeePlan}
        fields={feePlanFields(
          (seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
          (groups ?? []).map((g) => ({ value: g.id, label: g.name })),
        )}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Salva modifiche"
      />

      <h2 className="mb-3 mt-8 text-sm font-bold">Genera quote per un mese</h2>
      <EntityForm
        action={generateFees}
        fields={[{ name: "period", label: "Mese", type: "month", required: true }]}
        defaults={{ period: thisMonth }}
        hidden={{ fee_plan_id: row.id }}
        submitLabel="Genera quote"
      />
      <p className="mt-2 text-xs text-[var(--muted)]">
        Crea una quota per ogni atleta iscritto attivo al gruppo del piano, con
        rateo se previsto. Non duplica quote già presenti. Le vedi in{" "}
        <a className="text-[var(--blue)]" href="/abbonamenti/quote">
          Quote mensili
        </a>
        .
      </p>
    </div>
  );
}
