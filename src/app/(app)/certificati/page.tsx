import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  CERTIFICATE_STATUS_LABEL,
  daysUntil,
} from "@/lib/validation/documents";
import { runExpiryScan } from "@/server/actions/documents";

export const metadata = { title: "Certificati medici | ATHLETIX" };

type Row = {
  id: string;
  certificate_type: string;
  issued_on: string;
  expires_on: string;
  status: string;
  document_id: string | null;
  athletes: { first_name: string; last_name: string } | null;
};

export default async function CertificatiListPage(props: {
  searchParams: Promise<{ q?: string; stato?: string }>;
}) {
  const { q, stato = "" } = await props.searchParams;
  const org = await requirePermission("documents.manage");
  const supabase = await createClient();

  const [{ data: settings }, listRes] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("certificate_alert_days")
      .eq("organization_id", org.organizationId)
      .maybeSingle(),
    (async () => {
      let query = supabase
        .from("medical_certificates")
        .select(
          "id, certificate_type, issued_on, expires_on, status, document_id, athletes(first_name, last_name)",
        )
        .eq("organization_id", org.organizationId)
        .order("expires_on", { ascending: true });
      if (stato) query = query.eq("status", stato);
      return query;
    })(),
  ]);

  const alertDays = settings?.certificate_alert_days ?? 30;
  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim().toLowerCase();
  let rows = (listRes.data ?? []) as unknown as Row[];
  if (term) {
    rows = rows.filter((r) => {
      const name = `${r.athletes?.first_name ?? ""} ${r.athletes?.last_name ?? ""}`.toLowerCase();
      return name.includes(term);
    });
  }

  function expiryCell(r: Row) {
    const d = daysUntil(r.expires_on);
    const label = formatShortDate(`${r.expires_on}T12:00:00`);
    if (r.status !== "valid") return label;
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

  return (
    <div className="content">
      <PageHeader
        eyebrow="Documenti"
        title="Certificati medici"
        subtitle={`Preavviso scadenza: ${alertDays} giorni (modificabile in Impostazioni).`}
        action={{ href: "/certificati/nuovo", label: "Nuovo certificato" }}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <ListToolbar
          q={q}
          filters={[
            {
              name: "stato",
              value: stato,
              options: [
                { value: "", label: "Tutti gli stati" },
                { value: "valid", label: "Validi" },
                { value: "expired", label: "Scaduti" },
                { value: "revoked", label: "Revocati" },
              ],
            },
          ]}
        />
        <form action={runExpiryScan}>
          <button type="submit" className="outline-button whitespace-nowrap">
            Ricalcola scadenze
          </button>
        </form>
      </div>

      <DataTable<Row>
        columns={[
          {
            key: "athlete",
            label: "Atleta",
            render: (r) =>
              r.athletes
                ? `${r.athletes.first_name} ${r.athletes.last_name}`
                : "—",
          },
          { key: "certificate_type", label: "Tipo" },
          {
            key: "issued_on",
            label: "Rilasciato",
            render: (r) => formatShortDate(`${r.issued_on}T12:00:00`),
          },
          { key: "expires_on", label: "Scadenza", render: expiryCell },
          {
            key: "status",
            label: "Stato",
            render: (r) => CERTIFICATE_STATUS_LABEL[r.status] ?? r.status,
          },
          {
            key: "document_id",
            label: "Allegato",
            render: (r) => (r.document_id ? "Sì" : "—"),
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        rowHref={(r) => `/certificati/${r.id}`}
        empty={
          term
            ? "Nessun certificato per questa ricerca."
            : "Nessun certificato registrato. Aggiungine uno con «Nuovo certificato»."
        }
      />

      <p className="mt-4 text-xs text-[var(--muted)]">
        «Ricalcola scadenze» aggiorna gli stati e genera le notifiche per i
        documenti in scadenza. In produzione va schedulato (cron) —{" "}
        <Link href="/impostazioni" className="text-[var(--blue)]">
          vedi Impostazioni
        </Link>
        .
      </p>
    </div>
  );
}
