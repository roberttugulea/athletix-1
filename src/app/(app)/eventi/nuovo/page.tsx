import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "@/server/actions/events";
import { eventFields } from "../_fields";

export const metadata = { title: "Nuovo evento | ATHLETIX" };

export default async function NuovoEventoPage() {
  const org = await requirePermission("competitions.manage");
  const supabase = await createClient();

  const [{ data: facilities }, { data: spaces }] = await Promise.all([
    supabase
      .from("facilities")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .order("name"),
    supabase
      .from("spaces")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .order("name"),
  ]);

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/eventi", label: "Eventi" }, { label: "Nuovo" }]}
      />
      <PageHeader eyebrow="Organizzazione" title="Nuovo evento" />
      <EntityForm
        action={createEvent}
        fields={eventFields(
          (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
          (spaces ?? []).map((s) => ({ value: s.id, label: s.name })),
        )}
        submitLabel="Crea evento"
      />
    </div>
  );
}
