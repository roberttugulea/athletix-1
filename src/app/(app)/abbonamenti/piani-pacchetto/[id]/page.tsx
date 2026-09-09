import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateSubscriptionPlan } from "@/server/actions/billing";
import { subscriptionPlanFields } from "../../_fields";

export const metadata = { title: "Piano pacchetto | ATHLETIX" };

export default async function PianoPacchettoEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  const [{ data: row }, { data: disciplines }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("id, name, duration_months, price, discipline_id, active")
      .eq("organization_id", org.organizationId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("disciplines")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .order("name"),
  ]);

  if (!row) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/abbonamenti", label: "Abbonamenti" },
          { href: "/abbonamenti/piani-pacchetto", label: "Piani pacchetto" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Amministrazione" title={row.name} />
      <EntityForm
        action={updateSubscriptionPlan}
        fields={subscriptionPlanFields(
          (disciplines ?? []).map((d) => ({ value: d.id, label: d.name })),
        )}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Salva modifiche"
      />
    </div>
  );
}
