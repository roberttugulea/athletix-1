import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { createMembership } from "@/server/actions/documents";
import { membershipFields } from "../_fields";

export const metadata = { title: "Nuovo tesseramento | ATHLETIX" };

export default async function NuovoTesseramentoPage(props: {
  searchParams: Promise<{ atleta?: string }>;
}) {
  const { atleta } = await props.searchParams;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, first_name, last_name")
    .eq("organization_id", org.organizationId)
    .eq("status", "active")
    .order("last_name");

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/tesseramenti", label: "Tesseramenti" },
          { label: "Nuovo" },
        ]}
      />
      <PageHeader eyebrow="Documenti" title="Nuovo tesseramento" />
      <EntityForm
        action={createMembership}
        fields={membershipFields(
          (athletes ?? []).map((a) => ({
            value: a.id,
            label: `${a.last_name} ${a.first_name}`,
          })),
        )}
        defaults={{
          status: "active",
          starts_on: todayISO(),
          federation: "FITA",
          athlete_id: atleta ?? "",
        }}
        submitLabel="Registra tesseramento"
      />
    </div>
  );
}
