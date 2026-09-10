import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { CALL_STATUS_LABEL } from "@/lib/validation/competitions";
import { addCall, removeCall, setCallStatus } from "@/server/actions/competitions";

type CallRow = {
  id: string;
  status: string;
  athlete_id: string;
  athletes: { first_name: string; last_name: string } | null;
};

export async function CallsSection({
  competitionId,
  organizationId,
}: {
  competitionId: string;
  organizationId: string;
}) {
  const supabase = await createClient();

  const [{ data: calls }, { data: athletes }] = await Promise.all([
    supabase
      .from("competition_calls")
      .select("id, status, athlete_id, athletes(first_name, last_name)")
      .eq("competition_id", competitionId),
    supabase
      .from("athletes")
      .select("id, first_name, last_name")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("last_name"),
  ]);

  const rows = (calls ?? []) as unknown as CallRow[];
  const calledIds = new Set(rows.map((r) => r.athlete_id));
  const available = (athletes ?? []).filter((a) => !calledIds.has(a.id));

  const fields: FieldConfig[] = [
    {
      name: "athlete_id",
      label: "Atleta",
      type: "select",
      required: true,
      options: available.map((a) => ({
        value: a.id,
        label: `${a.last_name} ${a.first_name}`,
      })),
      width: "full",
    },
  ];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Convocazioni</h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {r.athletes
                      ? `${r.athletes.last_name} ${r.athletes.first_name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {CALL_STATUS_LABEL[r.status] ?? r.status}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          "pending",
                          "accepted",
                          "declined",
                          "withdrawn",
                        ] as const
                      )
                        .filter((s) => s !== r.status)
                        .map((s) => (
                          <form
                            key={s}
                            action={setCallStatus.bind(
                              null,
                              r.id,
                              competitionId,
                              s,
                            )}
                          >
                            <button
                              type="submit"
                              className="rounded border border-[var(--line)] px-2 py-0.5 text-[11px] font-semibold text-[var(--blue)]"
                            >
                              → {CALL_STATUS_LABEL[s]}
                            </button>
                          </form>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={removeCall.bind(null, r.id, competitionId)}>
                      <button
                        type="submit"
                        className="text-xs font-semibold text-red-600"
                      >
                        Rimuovi
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-xs text-[var(--muted)]">
          Nessun atleta convocato.
        </p>
      )}

      {available.length > 0 ? (
        <EntityForm
          action={addCall}
          fields={fields}
          hidden={{ competition_id: competitionId }}
          submitLabel="Convoca atleta"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Tutti gli atleti attivi sono già convocati.
        </p>
      )}
    </section>
  );
}
