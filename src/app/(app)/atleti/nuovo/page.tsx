import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createAthlete } from "@/server/actions/athletes";
import { athleteCreateFields } from "../_fields";

export const metadata = { title: "Nuovo atleta | ATHLETIX" };

export default async function NuovoAtletaPage() {
  await requirePermission("people.manage");

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/atleti", label: "Atleti" }, { label: "Nuovo" }]}
      />
      <PageHeader eyebrow="Anagrafica" title="Nuovo atleta" />
      <EntityForm
        action={createAthlete}
        fields={athleteCreateFields}
        submitLabel="Crea atleta"
      />
    </div>
  );
}
