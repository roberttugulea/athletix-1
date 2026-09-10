import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, formatTime, utcISOToLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent, updateEvent } from "@/server/actions/events";
import { eventFields } from "../_fields";

export const metadata = { title: "Evento | ATHLETIX" };

export default async function EventoDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("competitions.manage");
  const supabase = await createClient();

  const [{ data: ev }, { data: facilities }, { data: spaces }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, description, facility_id, space_id, starts_at, ends_at",
        )
        .eq("id", id)
        .eq("organization_id", org.organizationId)
        .maybeSingle(),
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

  if (!ev) notFound();

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/eventi", label: "Eventi" }, { label: ev.title }]}
      />
      <PageHeader
        eyebrow="Organizzazione"
        title={ev.title}
        subtitle={`${formatShortDate(ev.starts_at)} ${formatTime(
          ev.starts_at,
        )}–${formatTime(ev.ends_at)}`}
      />

      <EntityForm
        action={updateEvent}
        fields={eventFields(
          (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
          (spaces ?? []).map((s) => ({ value: s.id, label: s.name })),
        )}
        defaults={{
          title: ev.title,
          description: ev.description ?? "",
          facility_id: ev.facility_id ?? "",
          space_id: ev.space_id ?? "",
          starts_at: utcISOToLocalInput(ev.starts_at),
          ends_at: utcISOToLocalInput(ev.ends_at),
        }}
        hidden={{ id: ev.id }}
        submitLabel="Salva modifiche"
      />

      <form action={deleteEvent.bind(null, ev.id)} className="mt-4">
        <button type="submit" className="text-xs font-semibold text-red-600">
          Elimina evento
        </button>
      </form>
    </div>
  );
}
