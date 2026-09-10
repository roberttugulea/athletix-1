import Link from "next/link";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { deleteCertificate, updateCertificate } from "@/server/actions/documents";
import { certificateFields } from "../_fields";

export const metadata = { title: "Certificato medico | ATHLETIX" };

export default async function CertificatoDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("documents.manage");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("medical_certificates")
    .select(
      "id, athlete_id, certificate_type, issued_on, expires_on, status, document_id, athletes(first_name, last_name), private_documents(object_path, original_filename)",
    )
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  const who = row.athletes
    ? `${row.athletes.first_name} ${row.athletes.last_name}`
    : "Atleta";

  let signedUrl: string | null = null;
  const doc = row.private_documents as
    | { object_path: string; original_filename: string }
    | null;
  if (doc?.object_path) {
    const { data: signed } = await supabase.storage
      .from("private-documents")
      .createSignedUrl(doc.object_path, 300);
    signedUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/certificati", label: "Certificati" },
          { label: who },
        ]}
      />
      <PageHeader
        eyebrow="Documenti"
        title={`Certificato · ${who}`}
        subtitle={
          <Link
            href={`/atleti/${row.athlete_id}`}
            className="text-[var(--blue)]"
          >
            Apri scheda atleta
          </Link>
        }
      />

      {doc ? (
        <p className="mb-4 rounded-lg bg-[#eef4ff] px-3 py-2 text-xs">
          Allegato: <strong>{doc.original_filename}</strong>
          {signedUrl ? (
            <>
              {" — "}
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--blue)]"
              >
                apri (link valido 5 minuti)
              </a>
            </>
          ) : null}
        </p>
      ) : (
        <p className="mb-4 text-xs text-[var(--muted)]">Nessun allegato.</p>
      )}

      <EntityForm
        action={updateCertificate}
        fields={certificateFields()}
        defaults={{
          certificate_type: row.certificate_type,
          status: row.status,
          issued_on: row.issued_on,
          expires_on: row.expires_on,
        }}
        hidden={{ id: row.id, athlete_id: row.athlete_id }}
        submitLabel="Salva modifiche"
      />

      <form
        action={deleteCertificate.bind(null, row.id, row.athlete_id)}
        className="mt-4"
      >
        <button type="submit" className="text-xs font-semibold text-red-600">
          Elimina certificato{doc ? " e allegato" : ""}
        </button>
      </form>
    </div>
  );
}
