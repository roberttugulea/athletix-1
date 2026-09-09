import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { assignCoach, unassignCoach } from "@/server/actions/groups";

type CoachRow = {
  coach_id: string;
  is_lead: boolean;
  coaches: { first_name: string; last_name: string } | null;
};

export async function CoachesSection({ groupId }: { groupId: string }) {
  const supabase = await createClient();
  const { data: assigned } = await supabase
    .from("coach_groups")
    .select("coach_id, is_lead, coaches(first_name, last_name)")
    .eq("group_id", groupId);

  const rows = (assigned ?? []) as unknown as CoachRow[];
  const assignedIds = new Set(rows.map((r) => r.coach_id));

  const { data: allCoaches } = await supabase
    .from("coaches")
    .select("id, first_name, last_name")
    .eq("status", "active")
    .order("last_name");

  const available = (allCoaches ?? []).filter((c) => !assignedIds.has(c.id));

  const fields: FieldConfig[] = [
    {
      name: "coach_id",
      label: "Coach",
      type: "select",
      required: true,
      options: available.map((c) => ({
        value: c.id,
        label: `${c.last_name} ${c.first_name}`,
      })),
      width: "full",
    },
    { name: "is_lead", label: "Responsabile del gruppo", type: "checkbox" },
  ];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Coach</h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.coach_id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {r.coaches?.last_name} {r.coaches?.first_name}
                    {r.is_lead ? (
                      <span className="ml-2 rounded bg-[#eaf0ff] px-2 py-0.5 text-[10px] font-bold text-[#356ce7]">
                        RESPONSABILE
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={unassignCoach.bind(null, r.coach_id, groupId)}>
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
          Nessun coach assegnato.
        </p>
      )}

      {available.length > 0 ? (
        <EntityForm
          action={assignCoach}
          fields={fields}
          hidden={{ group_id: groupId }}
          submitLabel="Assegna coach"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Nessun altro coach disponibile.
        </p>
      )}
    </section>
  );
}
