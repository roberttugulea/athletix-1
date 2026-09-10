import { DataTable } from "@/components/ui/data-table";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  daysUntil,
  MEMBERSHIP_STATUS_LABEL,
} from "@/lib/validation/documents";
import { runExpiryScan } from "@/server/actions/documents";

export const metadata = { title: "Tesseramenti | ATHLETIX" };

type Row = {
  id: string;
  federation: string;
  membership_number: string;
  starts_on: string;
  ends_on: string | null;
  status: string;
  document_id: string | null;
  athletes: { first_name: string; last_name: string } | null;
};

export default async function TesseramentiListPage(props: {
  searchParams: Promise<{ q?: string; stato?: string }>;
}) {
  const { q, stato = "" } = await props.searchParams;
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  const [{ data: settings }, listRes] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("membership_alert_days")
      .eq("organization_id", org.organizationId)
      .maybeSingle(),
    (async () => {
      let query = supabase
        .from("fita_memberships")
        .select(
          "id, federation, membership_number, starts_on, ends_on, status, document_id, athletes(first_name, last_name)",
        )
        .eq("organization_id", org.organizationId)
        .order("ends_on", { ascending: true, nullsFirst: false });
      if (stato) query = query.eq("status", stato);
      return query;
    })(),
  ]);

  const alertDays = settings?.membership_alert_days ?? 30;
  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim().toLowerCase();
  let rows = (listRes.data ?? []) as unknown as Row[];
  if (term) {
    rows = rows.filter((r) => {
      const name = `${r.athletes?.first_name ?? ""} ${r.athletes?.last_name ?? ""}`.toLowerCase();
      return name.includes(term) || r.membership_number.toLowerCase().includes(term);
    });
  }

  function expiryCell(r: Row) {
    if (!r.ends_on) return "—";
    const label = formatShortDate(`${r.ends_on}T12:00:00`);
    if (r.status !== "active") return label;
    const d = daysUntil(r.ends_on);
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
        title="Tesseramenti"
        subtitle={`Preavviso scadenza: ${alertDays} giorni (modificabile in Impostazioni).`}
        action={{ href: "/tesseramenti/nuovo", label: "Nuovo tesseramento" }}
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
                { value: "active", label: "Attivi" },
                { value: "expired", label: "Scaduti" },
                { value: "suspended", label: "Sospesi" },
                { value: "cancelled", label: "Annullati" },
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
          { key: "federation", label: "Federazione" },
          { key: "membership_number", label: "N. tessera" },
          {
            key: "starts_on",
            label: "Dal",
            render: (r) => formatShortDate(`${r.starts_on}T12:00:00`),
          },
          { key: "ends_on", label: "Scadenza", render: expiryCell },
          {
            key: "status",
            label: "Stato",
            render: (r) => MEMBERSHIP_STATUS_LABEL[r.status] ?? r.status,
          },
          {
            key: "document_id",
            label: "Allegato",
            render: (r) => (r.document_id ? "Sì" : "—"),
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        rowHref={(r) => `/tesseramenti/${r.id}`}
        empty={
          term
            ? "Nessun tesseramento per questa ricerca."
            : "Nessun tesseramento registrato. Aggiungine uno con «Nuovo tesseramento»."
        }
      />
    </div>
  );
}
