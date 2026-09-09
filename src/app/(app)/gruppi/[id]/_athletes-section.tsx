import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { enrollAthlete, unenrollAthlete } from "@/server/actions/groups";

type EnrollRow = {
  athlete_id: string;
  starts_on: string;
  athletes: { first_name: string; last_name: string } | null;
};

export async function AthletesSection({
  groupId,
  capacity,
}: {
  groupId: string;
  capacity: number | null;
}) {
  const supabase = await createClient();
  const { data: enrolled } = await supabase
    .from("athlete_groups")
    .select("athlete_id, starts_on, athletes(first_name, last_name)")
    .eq("group_id", groupId)
    .is("ends_on", null);

  const rows = (enrolled ?? []) as unknown as EnrollRow[];
  const enrolledIds = new Set(rows.map((r) => r.athlete_id));

  const { data: allAthletes } = await supabase
    .from("athletes")
    .select("id, first_name, last_name")
    .eq("status", "active")
    .order("last_name");

  const available = (allAthletes ?? []).filter((a) => !enrolledIds.has(a.id));
  const full = capacity != null && rows.length >= capacity;

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
      <h2 className="mb-3 text-sm font-bold">
        Atleti iscritti{" "}
        <span className="text-xs font-normal text-[var(--muted)]">
          {rows.length}
          {capacity != null ? ` / ${capacity}` : ""}
        </span>
      </h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.athlete_id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {r.athletes?.last_name} {r.athletes?.first_name}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    dal {r.starts_on}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={unenrollAthlete.bind(null, r.athlete_id, groupId)}
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
        <p className="mb-4 text-xs text-[var(--muted)]">Nessun atleta iscritto.</p>
      )}

      {full ? (
        <p className="text-xs text-[#8a5a12]">
          Gruppo al completo (capienza {capacity}).
        </p>
      ) : available.length > 0 ? (
        <EntityForm
          action={enrollAthlete}
          fields={fields}
          hidden={{ group_id: groupId }}
          submitLabel="Iscrivi atleta"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Nessun altro atleta disponibile.
        </p>
      )}
    </section>
  );
}
