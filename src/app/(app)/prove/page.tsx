import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { addTrial, setTrialStatus } from "@/server/actions/trials";

export const metadata = { title: "Prove gratuite | ATHLETIX" };

type Row = {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  scheduled_at: string;
  status: string;
  facilities: { name: string } | null;
  groups: { name: string } | null;
};

const STATUS: Record<string, string> = {
  scheduled: "In programma",
  attended: "Presentato",
  cancelled: "Annullata",
  converted: "Iscritto",
};

export default async function ProvePage() {
  const org = await requirePermission("people.manage");
  const supabase = await createClient();

  const [{ data: trials }, { data: facilities }, { data: groups }] =
    await Promise.all([
      supabase
        .from("trial_lessons")
        .select(
          "id, contact_name, contact_email, contact_phone, scheduled_at, status, facilities(name), groups(name)",
        )
        .eq("organization_id", org.organizationId)
        .order("scheduled_at", { ascending: false })
        .limit(50),
      supabase
        .from("facilities")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .eq("active", true)
        .order("name"),
      supabase
        .from("groups")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .eq("active", true)
        .order("name"),
    ]);

  const rows = (trials ?? []) as unknown as Row[];

  const fields: FieldConfig[] = [
    { name: "contact_name", label: "Nome contatto", required: true },
    { name: "contact_email", label: "Email", type: "email" },
    { name: "contact_phone", label: "Telefono", type: "tel" },
    {
      name: "facility_id",
      label: "Struttura",
      type: "select",
      required: true,
      options: (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
    },
    {
      name: "group_id",
      label: "Gruppo (facoltativo)",
      type: "select",
      options: (groups ?? []).map((g) => ({ value: g.id, label: g.name })),
    },
    {
      name: "scheduled_at",
      label: "Data e ora",
      type: "datetime-local",
      required: true,
      width: "full",
    },
    { name: "notes", label: "Note", width: "full" },
  ];

  return (
    <div className="content">
      <PageHeader
        eyebrow="Operatività"
        title="Prove gratuite"
        subtitle="Lezioni di prova per potenziali iscritti."
      />

      {rows.length > 0 ? (
        <div className="panel mb-8" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#eef1f5] text-left">
                {["Contatto", "Quando", "Struttura", "Gruppo", "Stato", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold">{t.contact_name}</span>
                    <span className="block text-xs text-[var(--muted)]">
                      {t.contact_email ?? t.contact_phone ?? ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {formatShortDate(t.scheduled_at)} {formatTime(t.scheduled_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {t.facilities?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {t.groups?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {STATUS[t.status] ?? t.status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      {t.status !== "attended" ? (
                        <form action={setTrialStatus.bind(null, t.id, "attended")}>
                          <button className="text-xs font-semibold text-[var(--blue)]">
                            Presentato
                          </button>
                        </form>
                      ) : null}
                      {t.status !== "converted" ? (
                        <form
                          action={setTrialStatus.bind(null, t.id, "converted")}
                        >
                          <button className="text-xs font-semibold text-[#1f7a5a]">
                            Iscritto
                          </button>
                        </form>
                      ) : null}
                      {t.status !== "cancelled" ? (
                        <form
                          action={setTrialStatus.bind(null, t.id, "cancelled")}
                        >
                          <button className="text-xs font-semibold text-red-600">
                            Annulla
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel mb-8">
          <div className="empty-state">
            <span className="empty-icon">✦</span>
            <p>Nessuna prova registrata.</p>
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-bold">Nuova prova</h2>
      {(facilities ?? []).length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          Serve almeno una struttura attiva.
        </p>
      ) : (
        <EntityForm
          action={addTrial}
          fields={fields}
          submitLabel="Registra prova"
        />
      )}
    </div>
  );
}
