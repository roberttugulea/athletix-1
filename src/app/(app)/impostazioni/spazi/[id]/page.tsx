import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateSpace } from "@/server/actions/config";
import { spaceFields } from "../../_fields";

export const metadata = { title: "Modifica spazio | ATHLETIX" };

export default async function SpazioEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();

  const [{ data: row }, { data: facilities }] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, name, capacity, active, facility_id")
      .eq("organization_id", org.organizationId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("facilities")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .order("name"),
  ]);

  if (!row) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { href: "/impostazioni/spazi", label: "Spazi" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Configurazione" title={row.name} />
      <EntityForm
        action={updateSpace}
        fields={spaceFields(
          (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
        )}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Aggiorna"
      />
    </div>
  );
}
