import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateDiscipline } from "@/server/actions/config";
import { disciplineFields } from "../../_fields";

export const metadata = { title: "Modifica disciplina | ATHLETIX" };

export default async function DisciplinaEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("facilities.manage");
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("disciplines")
    .select("id, name, color, active")
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { href: "/impostazioni/discipline", label: "Discipline" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Configurazione" title={row.name} />
      <EntityForm
        action={updateDiscipline}
        fields={disciplineFields}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Aggiorna"
      />
    </div>
  );
}
