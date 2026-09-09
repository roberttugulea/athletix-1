import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateCategory } from "@/server/actions/categories";
import { categoryFields } from "../_fields";

export const metadata = { title: "Modifica categoria | ATHLETIX" };

export default async function CategoriaEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  const [{ data: row }, { data: disciplines }] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id, kind, name, discipline_id, min_value, max_value, unit, active",
      )
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
          { href: "/categorie", label: "Categorie" },
          { label: row.name },
        ]}
      />
      <PageHeader eyebrow="Anagrafica" title={row.name} />
      <EntityForm
        action={updateCategory}
        fields={categoryFields(
          (disciplines ?? []).map((d) => ({ value: d.id, label: d.name })),
        )}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Salva modifiche"
      />
    </div>
  );
}
