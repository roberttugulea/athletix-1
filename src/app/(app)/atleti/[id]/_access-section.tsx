import { EntityForm } from "@/components/ui/entity-form";
import { ageFromBirthDate, isMinor } from "@/lib/validation/access";
import { grantAthleteAccess, revokeAthleteAccess } from "@/server/actions/access";

export function AccessSection({
  athleteId,
  email,
  birthDate,
  linked,
}: {
  athleteId: string;
  email: string | null;
  birthDate: string | null;
  linked: boolean;
}) {
  const minor = isMinor(birthDate);
  const age = ageFromBirthDate(birthDate);

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Accesso all&apos;area personale</h2>

      {linked ? (
        <div className="panel flex items-center justify-between gap-3 p-4">
          <p className="text-sm">
            <span className="rounded bg-[#e7f6ec] px-2 py-0.5 text-[11px] font-bold text-[#1f7a3d]">
              ATTIVO
            </span>{" "}
            <span className="text-[var(--muted)]">
              L&apos;atleta può accedere con l&apos;email {email ?? "collegata"}.
            </span>
          </p>
          <form action={revokeAthleteAccess.bind(null, athleteId)}>
            <button
              type="submit"
              className="text-xs font-semibold text-red-600"
            >
              Revoca accesso
            </button>
          </form>
        </div>
      ) : minor ? (
        <p className="rounded-lg bg-[#fff5e5] px-3 py-2 text-xs text-[#8a5a12]">
          Atleta minorenne{age != null ? ` (${age} anni)` : ""}: l&apos;accesso
          va assegnato a un tutore, nella sezione «Tutori» qui sopra.
        </p>
      ) : !email ? (
        <p className="text-xs text-[var(--muted)]">
          Per abilitare l&apos;accesso, aggiungi un&apos;email nella scheda
          dell&apos;atleta.
        </p>
      ) : (
        <div>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Crea le credenziali per l&apos;email <strong>{email}</strong>. Verrà
            mostrata una password provvisoria da comunicare all&apos;atleta.
          </p>
          <EntityForm
            action={grantAthleteAccess}
            fields={[]}
            hidden={{ athlete_id: athleteId }}
            submitLabel="Crea accesso"
          />
        </div>
      )}
    </section>
  );
}
