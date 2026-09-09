import { EntityForm } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { addGuardian, removeGuardian } from "@/server/actions/guardians";
import { guardianFields } from "../_fields";

type GuardianRow = {
  guardian_id: string;
  relationship: string;
  is_primary: boolean;
  guardians: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export async function GuardiansSection({ athleteId }: { athleteId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_guardians")
    .select(
      "guardian_id, relationship, is_primary, guardians(first_name, last_name, email, phone)",
    )
    .eq("athlete_id", athleteId);

  const rows = (data ?? []) as GuardianRow[];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Tutori</h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.guardian_id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {r.guardians?.last_name} {r.guardians?.first_name}
                    </span>
                    {r.is_primary ? (
                      <span className="ml-2 rounded bg-[#eaf0ff] px-2 py-0.5 text-[10px] font-bold text-[#356ce7]">
                        REFERENTE
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {r.relationship}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {r.guardians?.email ?? r.guardians?.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={removeGuardian.bind(
                        null,
                        athleteId,
                        r.guardian_id,
                      )}
                    >
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
          Nessun tutore collegato. Per gli atleti minorenni aggiungine almeno
          uno (massimo due).
        </p>
      )}

      {rows.length < 2 ? (
        <EntityForm
          action={addGuardian}
          fields={guardianFields}
          hidden={{ athlete_id: athleteId }}
          submitLabel="Aggiungi tutore"
        />
      ) : null}
    </section>
  );
}
