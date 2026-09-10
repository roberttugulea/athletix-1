import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createCommunication } from "@/server/actions/communications";
import { communicationFields } from "../_fields";

export const metadata = { title: "Nuova comunicazione | ATHLETIX" };

export default async function NuovaComunicazionePage() {
  await requirePermission("communications.manage");

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/comunicazioni", label: "Comunicazioni" },
          { label: "Nuova" },
        ]}
      />
      <PageHeader eyebrow="Comunicazione" title="Nuova comunicazione" />
      <EntityForm
        action={createCommunication}
        fields={communicationFields}
        defaults={{ channel: "in_app" }}
        submitLabel="Crea bozza"
      />
    </div>
  );
}
