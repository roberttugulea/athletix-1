import { EntityForm } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAYS } from "@/lib/validation/groups";
import { addSlot, removeSlot } from "@/server/actions/groups";
import { slotFields } from "../_fields";

type SlotRow = {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  valid_from: string;
  valid_to: string | null;
  spaces: { name: string } | null;
};

const hhmm = (t: string) => t.slice(0, 5);

export async function SlotsSection({
  groupId,
  facilityId,
}: {
  groupId: string;
  facilityId: string;
}) {
  const supabase = await createClient();
  const [{ data: slots }, { data: spaces }] = await Promise.all([
    supabase
      .from("group_schedule_slots")
      .select("id, weekday, starts_at, ends_at, valid_from, valid_to, spaces(name)")
      .eq("group_id", groupId)
      .order("weekday")
      .order("starts_at"),
    supabase
      .from("spaces")
      .select("id, name")
      .eq("facility_id", facilityId)
      .eq("active", true)
      .order("name"),
  ]);

  const rows = (slots ?? []) as unknown as SlotRow[];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Fasce orarie</h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {WEEKDAYS[s.weekday]}
                  </td>
                  <td className="px-4 py-3">
                    {hhmm(s.starts_at)}–{hhmm(s.ends_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {s.spaces?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    dal {s.valid_from}
                    {s.valid_to ? ` al ${s.valid_to}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={removeSlot.bind(null, s.id, groupId)}>
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
          Nessuna fascia oraria.
        </p>
      )}

      {spaces?.length ? (
        <EntityForm
          action={addSlot}
          fields={slotFields(
            spaces.map((s) => ({ value: s.id, label: s.name })),
          )}
          hidden={{ group_id: groupId }}
          submitLabel="Aggiungi fascia"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          La struttura del gruppo non ha spazi attivi: creane in Impostazioni →
          Spazi.
        </p>
      )}
    </section>
  );
}
