import Link from "next/link";

import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  CERTIFICATE_STATUS_LABEL,
  daysUntil,
  MEMBERSHIP_STATUS_LABEL,
} from "@/lib/validation/documents";

type Cert = {
  id: string;
  certificate_type: string;
  issued_on: string;
  expires_on: string;
  status: string;
  document_id: string | null;
};

type Member = {
  id: string;
  federation: string;
  membership_number: string;
  starts_on: string;
  ends_on: string | null;
  status: string;
  document_id: string | null;
};

function expiry(iso: string | null, active: boolean, alertDays: number) {
  if (!iso) return <span className="text-[var(--muted)]">—</span>;
  const label = formatShortDate(`${iso}T12:00:00`);
  if (!active) return label;
  const d = daysUntil(iso);
  if (d < 0)
    return <span className="font-semibold text-red-600">{label} · scaduto</span>;
  if (d <= alertDays)
    return (
      <span className="font-semibold text-[#b26a00]">
        {label} · tra {d} g
      </span>
    );
  return label;
}

export async function DocumentsSection({
  athleteId,
  organizationId,
}: {
  athleteId: string;
  organizationId: string;
}) {
  const supabase = await createClient();

  const [{ data: settings }, { data: certs }, { data: members }] =
    await Promise.all([
      supabase
        .from("organization_settings")
        .select("certificate_alert_days, membership_alert_days")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("medical_certificates")
        .select(
          "id, certificate_type, issued_on, expires_on, status, document_id",
        )
        .eq("athlete_id", athleteId)
        .order("expires_on", { ascending: false }),
      supabase
        .from("fita_memberships")
        .select(
          "id, federation, membership_number, starts_on, ends_on, status, document_id",
        )
        .eq("athlete_id", athleteId)
        .order("starts_on", { ascending: false }),
    ]);

  const certAlert = settings?.certificate_alert_days ?? 30;
  const memAlert = settings?.membership_alert_days ?? 30;
  const certRows = (certs ?? []) as Cert[];
  const memRows = (members ?? []) as Member[];

  return (
    <>
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Certificati medici</h2>
          <Link
            href={`/certificati/nuovo?atleta=${athleteId}`}
            className="text-xs font-semibold text-[var(--blue)]"
          >
            + Aggiungi
          </Link>
        </div>
        {certRows.length > 0 ? (
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {certRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#f1f4f9] last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/certificati/${r.id}`}
                        className="text-[var(--blue)]"
                      >
                        {r.certificate_type}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      rilasciato {formatShortDate(`${r.issued_on}T12:00:00`)}
                    </td>
                    <td className="px-4 py-3">
                      {expiry(r.expires_on, r.status === "valid", certAlert)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {CERTIFICATE_STATUS_LABEL[r.status] ?? r.status}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {r.document_id ? "📎" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun certificato registrato.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Tesseramenti</h2>
          <Link
            href={`/tesseramenti/nuovo?atleta=${athleteId}`}
            className="text-xs font-semibold text-[var(--blue)]"
          >
            + Aggiungi
          </Link>
        </div>
        {memRows.length > 0 ? (
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {memRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#f1f4f9] last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/tesseramenti/${r.id}`}
                        className="text-[var(--blue)]"
                      >
                        {r.federation}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      n. {r.membership_number}
                    </td>
                    <td className="px-4 py-3">
                      {expiry(r.ends_on, r.status === "active", memAlert)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {MEMBERSHIP_STATUS_LABEL[r.status] ?? r.status}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {r.document_id ? "📎" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun tesseramento registrato.
          </p>
        )}
      </section>
    </>
  );
}
