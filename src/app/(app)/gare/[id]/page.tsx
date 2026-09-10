import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { updateCompetition } from "@/server/actions/competitions";
import { competitionFields } from "../_fields";
import { CallsSection } from "./_calls-section";
import { ResultsSection } from "./_results-section";

export const metadata = { title: "Gara | ATHLETIX" };

export default async function GaraDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("competitions.manage");
  const supabase = await createClient();

  const [{ data: comp }, { data: seasons }] = await Promise.all([
    supabase
      .from("competitions")
      .select(
        "id, name, season_id, organizer, location, starts_on, ends_on, registration_deadline",
      )
      .eq("id", id)
      .eq("organization_id", org.organizationId)
      .maybeSingle(),
    supabase
      .from("seasons")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .order("starts_on", { ascending: false }),
  ]);

  if (!comp) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/gare", label: "Gare" }, { label: comp.name }]}
      />
      <PageHeader
        eyebrow="Attività agonistica"
        title={comp.name}
        subtitle={`${formatShortDate(`${comp.starts_on}T12:00:00`)}${
          comp.location ? ` · ${comp.location}` : ""
        }`}
      />

      <EntityForm
        action={updateCompetition}
        fields={competitionFields(
          (seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
        )}
        defaults={{
          name: comp.name,
          season_id: comp.season_id ?? "",
          organizer: comp.organizer ?? "",
          location: comp.location ?? "",
          starts_on: comp.starts_on,
          ends_on: comp.ends_on,
          registration_deadline: comp.registration_deadline ?? "",
        }}
        hidden={{ id: comp.id }}
        submitLabel="Salva modifiche"
      />

      <CallsSection
        competitionId={comp.id}
        organizationId={org.organizationId}
      />
      <ResultsSection
        competitionId={comp.id}
        organizationId={org.organizationId}
      />
    </div>
  );
}
