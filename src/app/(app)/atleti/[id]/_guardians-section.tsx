import { EntityForm } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import {
  grantGuardianAccess,
  revokeGuardianAccess,
} from "@/server/actions/access";
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
    profile_id: string | null;
  } | null;
};

export async function GuardiansSection({ athleteId }: { athleteId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_guardians")
    .select(
      "guardian_id, relationship, is_primary, guardians(first_name, last_name, email, phone, profile_id)",
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
                    {r.guardians?.profile_id ? (
                      <span className="ml-2 rounded bg-[#e7f6ec] px-2 py-0.5 text-[10px] font-bold text-[#1f7a3d]">
                        ACCESSO ATTIVO
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
                    <div className="flex justify-end gap-3">
                      {r.guardians?.profile_id ? (
                        <form
                          action={revokeGuardianAccess.bind(
                            null,
                            r.guardian_id,
                            athleteId,
                          )}
                        >
                          <button
                            type="submit"
                            className="text-xs font-semibold text-[#8a5a12]"
                          >
                            Revoca accesso
                          </button>
                        </form>
                      ) : null}
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
                    </div>
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

      {rows.some((r) => r.guardians && !r.guardians.profile_id) ? (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold text-[var(--muted)]">
            Abilita l&apos;accesso all&apos;area personale
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {rows
              .filter((r) => r.guardians && !r.guardians.profile_id)
              .map((r) => (
                <div key={r.guardian_id} className="panel p-4">
                  <p className="mb-2 text-sm font-semibold">
                    {r.guardians?.last_name} {r.guardians?.first_name}
                  </p>
                  {r.guardians?.email ? (
                    <>
                      <p className="mb-3 text-[11px] text-[var(--muted)]">
                        Credenziali per {r.guardians.email}
                      </p>
                      <EntityForm
                        action={grantGuardianAccess}
                        fields={[]}
                        hidden={{
                          guardian_id: r.guardian_id,
                          athlete_id: athleteId,
                        }}
                        submitLabel="Crea accesso"
                      />
                    </>
                  ) : (
                    <p className="text-[11px] text-[var(--muted)]">
                      Aggiungi un&apos;email a questo tutore per abilitare
                      l&apos;accesso.
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : null}

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
