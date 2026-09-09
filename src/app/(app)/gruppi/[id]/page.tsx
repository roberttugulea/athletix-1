import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateGroup } from "@/server/actions/groups";
import { groupFields } from "../_fields";
import { AthletesSection } from "./_athletes-section";
import { CoachesSection } from "./_coaches-section";
import { SlotsSection } from "./_slots-section";

export const metadata = { title: "Gruppo | ATHLETIX" };

export default async function GruppoDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("groups.manage");
  const supabase = await createClient();

  const [{ data: row }, { data: facilities }, { data: seasons }, { data: disc }] =
    await Promise.all([
      supabase
        .from("groups")
        .select(
          "id, name, facility_id, season_id, discipline_id, capacity, active",
        )
        .eq("organization_id", org.organizationId)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("facilities")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("name"),
      supabase
        .from("seasons")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("starts_on", { ascending: false }),
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
        items={[{ href: "/gruppi", label: "Gruppi" }, { label: row.name }]}
      />
      <PageHeader eyebrow="Struttura sportiva" title={row.name} />

      <EntityForm
        action={updateGroup}
        fields={groupFields(
          (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
          (seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
          (disc ?? []).map((d) => ({ value: d.id, label: d.name })),
        )}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Salva modifiche"
      />

      <SlotsSection groupId={row.id} facilityId={row.facility_id} />
      <CoachesSection groupId={row.id} />
      <AthletesSection groupId={row.id} capacity={row.capacity} />
    </div>
  );
}
