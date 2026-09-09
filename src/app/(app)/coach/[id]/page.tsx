import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  archiveCoach,
  restoreCoach,
  updateCoach,
} from "@/server/actions/coaches";
import { coachFields } from "../_fields";

export const metadata = { title: "Scheda coach | ATHLETIX" };

export default async function CoachDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("coaches")
    .select(
      "id, first_name, last_name, tax_code, email, phone, qualifications, status",
    )
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  const archived = row.status === "archived";
  const fullName = `${row.first_name} ${row.last_name}`;
  const defaults = {
    ...row,
    qualifications: Array.isArray(row.qualifications)
      ? (row.qualifications as string[]).join(", ")
      : "",
  };

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/coach", label: "Coach" }, { label: fullName }]}
      />
      <PageHeader
        eyebrow="Anagrafica"
        title={fullName}
        action={
          archived ? (
            <form action={restoreCoach.bind(null, row.id)}>
              <button type="submit" className="primary-button">
                Ripristina
              </button>
            </form>
          ) : (
            <form action={archiveCoach.bind(null, row.id)}>
              <button type="submit" className="outline-button">
                Archivia
              </button>
            </form>
          )
        }
      />

      {archived ? (
        <p className="mb-4 rounded-lg bg-[#fff5e5] px-3 py-2 text-xs text-[#8a5a12]">
          Coach archiviato.
        </p>
      ) : null}

      <EntityForm
        action={updateCoach}
        fields={coachFields}
        defaults={defaults}
        hidden={{ id: row.id }}
        submitLabel="Salva modifiche"
      />

      <p className="mt-6 text-xs text-[var(--muted)]">
        L&apos;assegnazione a gruppi e strutture sarà disponibile con il modulo
        Gruppi.
      </p>
    </div>
  );
}
