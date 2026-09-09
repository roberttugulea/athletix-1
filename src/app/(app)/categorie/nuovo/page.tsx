import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createCategory } from "@/server/actions/categories";
import { categoryFields } from "../_fields";

export const metadata = { title: "Nuova categoria | ATHLETIX" };

export default async function NuovaCategoriaPage() {
  const org = await requirePermission("people.manage");
  const supabase = await createClient();
  const { data: disciplines } = await supabase
    .from("disciplines")
    .select("id, name")
    .eq("organization_id", org.organizationId)
    .order("name");

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/categorie", label: "Categorie" }, { label: "Nuova" }]}
      />
      <PageHeader eyebrow="Anagrafica" title="Nuova categoria" />
      <EntityForm
        action={createCategory}
        fields={categoryFields(
          (disciplines ?? []).map((d) => ({ value: d.id, label: d.name })),
        )}
        defaults={{ active: true }}
        submitLabel="Crea categoria"
      />
    </div>
  );
}
