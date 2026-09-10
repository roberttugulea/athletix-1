import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { createCertificate } from "@/server/actions/documents";
import { certificateFields } from "../_fields";

export const metadata = { title: "Nuovo certificato | ATHLETIX" };

export default async function NuovoCertificatoPage(props: {
  searchParams: Promise<{ atleta?: string }>;
}) {
  const { atleta } = await props.searchParams;
  const org = await requirePermission("documents.manage");
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
          { href: "/certificati", label: "Certificati" },
          { label: "Nuovo" },
        ]}
      />
      <PageHeader eyebrow="Documenti" title="Nuovo certificato medico" />
      <EntityForm
        action={createCertificate}
        fields={certificateFields(
          (athletes ?? []).map((a) => ({
            value: a.id,
            label: `${a.last_name} ${a.first_name}`,
          })),
        )}
        defaults={{
          status: "valid",
          issued_on: todayISO(),
          athlete_id: atleta ?? "",
        }}
        submitLabel="Registra certificato"
      />
    </div>
  );
}
