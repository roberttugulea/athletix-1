import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createCompetition } from "@/server/actions/competitions";
import { competitionFields } from "../_fields";

export const metadata = { title: "Nuova gara | ATHLETIX" };

export default async function NuovaGaraPage() {
  const org = await requirePermission("competitions.manage");
  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("organization_id", org.organizationId)
    .order("starts_on", { ascending: false });

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/gare", label: "Gare" }, { label: "Nuova" }]}
      />
      <PageHeader eyebrow="Attività agonistica" title="Nuova gara" />
      <EntityForm
        action={createCompetition}
        fields={competitionFields(
          (seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
        )}
        submitLabel="Crea gara"
      />
    </div>
  );
}
