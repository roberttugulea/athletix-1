import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateFacility } from "@/server/actions/config";
import { facilityFields } from "../../_fields";

export const metadata = { title: "Modifica struttura | ATHLETIX" };

export default async function StrutturaEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("facilities")
    .select("id, name, address_line1, city, province, postal_code, active")
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { href: "/impostazioni/strutture", label: "Strutture" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Configurazione" title={row.name} />
      <EntityForm
        action={updateFacility}
        fields={facilityFields}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Aggiorna"
      />
    </div>
  );
}
