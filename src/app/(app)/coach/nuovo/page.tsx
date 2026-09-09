import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createCoach } from "@/server/actions/coaches";
import { coachCreateFields } from "../_fields";

export const metadata = { title: "Nuovo coach | ATHLETIX" };

export default async function NuovoCoachPage() {
  await requirePermission("people.manage");

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/coach", label: "Coach" }, { label: "Nuovo" }]}
      />
      <PageHeader eyebrow="Anagrafica" title="Nuovo coach" />
      <EntityForm
        action={createCoach}
        fields={coachCreateFields}
        submitLabel="Crea coach"
      />
    </div>
  );
}
