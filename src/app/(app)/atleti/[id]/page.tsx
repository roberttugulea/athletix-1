import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  archiveAthlete,
  restoreAthlete,
  updateAthlete,
} from "@/server/actions/athletes";
import { athleteFields } from "../_fields";

export const metadata = { title: "Scheda atleta | ATHLETIX" };

export default async function AtletaDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("athletes")
    .select(
      "id, first_name, last_name, birth_date, tax_code, email, phone, status, joined_on, profile_id",
    )
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  const archived = row.status === "archived";
  const fullName = `${row.first_name} ${row.last_name}`;

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/atleti", label: "Atleti" }, { label: fullName }]}
      />
      <PageHeader
        eyebrow="Anagrafica"
        title={fullName}
        subtitle={`Iscritto dal ${row.joined_on}${
          row.profile_id ? " · account collegato" : ""
        }`}
        action={
          archived ? (
            <form action={restoreAthlete.bind(null, row.id)}>
              <button type="submit" className="primary-button">
                Ripristina
              </button>
            </form>
          ) : (
            <form action={archiveAthlete.bind(null, row.id)}>
              <button type="submit" className="outline-button">
                Archivia
              </button>
            </form>
          )
        }
      />

      {archived ? (
        <p className="mb-4 rounded-lg bg-[#fff5e5] px-3 py-2 text-xs text-[#8a5a12]">
          Atleta archiviato. I dati storici restano consultabili.
        </p>
      ) : null}

      <EntityForm
        action={updateAthlete}
        fields={athleteFields}
        defaults={row}
        hidden={{ id: row.id }}
        submitLabel="Salva modifiche"
      />

      <p className="mt-6 text-xs text-[var(--muted)]">
        Gruppi, abbonamenti, certificati e tesseramenti dell&apos;atleta
        arriveranno nei prossimi incrementi.
      </p>
    </div>
  );
}
