import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateSeason } from "@/server/actions/config";
import { seasonFields } from "../../_fields";

export const metadata = { title: "Modifica stagione | ATHLETIX" };

export default async function StagioneEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("seasons")
    .select("id, name, starts_on, ends_on, is_current")
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { href: "/impostazioni/stagioni", label: "Stagioni" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Configurazione" title={row.name} />
      <EntityForm
        action={updateSeason}
        fields={seasonFields}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Aggiorna"
      />
    </div>
  );
}
