import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Registro attività | ATHLETIX" };

type Row = {
  id: number;
  created_at: string;
  actor: string;
  table_name: string;
  action: string;
  record_id: string | null;
  summary: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  INSERT: "Creazione",
  UPDATE: "Modifica",
  DELETE: "Eliminazione",
};

const TABLE_LABEL: Record<string, string> = {
  athletes: "Atleta",
  guardians: "Tutore",
  coaches: "Coach",
  groups: "Gruppo",
  monthly_fees: "Quota",
  payments: "Pagamento",
  training_sessions: "Sessione",
  competitions: "Gara",
  events: "Evento",
  communications: "Comunicazione",
  organizations: "Organizzazione",
  organization_members: "Membro",
  medical_certificates: "Certificato",
  fita_memberships: "Tesseramento",
  private_documents: "Documento",
};

export default async function AuditPage() {
  const org = await requirePermission("organization.manage");
  const supabase = await createClient();

  const { data } = await supabase.rpc("list_audit_logs", {
    p_org: org.organizationId,
    p_limit: 150,
  });
  const rows = (data ?? []) as Row[];

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { label: "Registro attività" },
        ]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Registro attività"
        subtitle="Ultime modifiche ai dati, con autore e campi toccati (append-only)."
      />

      {rows.length === 0 ? (
        <p className="panel p-5 text-sm text-[var(--muted)]">
          Nessuna voce registrata.
        </p>
      ) : (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#eef1f5] text-left">
                {["Quando", "Autore", "Oggetto", "Azione", "Campi"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                    {formatShortDate(r.created_at)} {formatTime(r.created_at)}
                  </td>
                  <td className="px-4 py-3">{r.actor}</td>
                  <td className="px-4 py-3">
                    {TABLE_LABEL[r.table_name] ?? r.table_name}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {r.summary ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
