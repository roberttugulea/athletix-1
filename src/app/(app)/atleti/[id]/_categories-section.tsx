import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { KIND_LABEL } from "@/lib/validation/categories";
import {
  assignAthleteCategory,
  removeAthleteCategory,
} from "@/server/actions/categories";

type Row = {
  category_id: string;
  valid_from: string;
  valid_to: string | null;
  measured_value: number | null;
  categories: { name: string; kind: string; unit: string | null } | null;
};

export async function CategoriesSection({
  athleteId,
  organizationId,
}: {
  athleteId: string;
  organizationId: string;
}) {
  const supabase = await createClient();

  const [{ data: assigned }, { data: cats }] = await Promise.all([
    supabase
      .from("athlete_categories")
      .select(
        "category_id, valid_from, valid_to, measured_value, categories(name, kind, unit)",
      )
      .eq("athlete_id", athleteId)
      .order("valid_from", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, kind")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("kind")
      .order("name"),
  ]);

  const rows = (assigned ?? []) as unknown as Row[];

  const fields: FieldConfig[] = [
    {
      name: "category_id",
      label: "Categoria",
      type: "select",
      required: true,
      options: (cats ?? []).map((c) => ({
        value: c.id,
        label: `${KIND_LABEL[c.kind] ?? c.kind} · ${c.name}`,
      })),
      width: "full",
    },
    { name: "valid_from", label: "Valida dal", type: "date", required: true },
    { name: "measured_value", label: "Valore rilevato", type: "number" },
  ];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Categorie</h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.category_id}-${r.valid_from}`}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {r.categories
                      ? `${KIND_LABEL[r.categories.kind] ?? r.categories.kind} · ${r.categories.name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    dal {r.valid_from}
                    {r.valid_to ? ` al ${r.valid_to}` : ""}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {r.measured_value != null
                      ? `${r.measured_value}${r.categories?.unit ? ` ${r.categories.unit}` : ""}`
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={removeAthleteCategory.bind(
                        null,
                        athleteId,
                        r.category_id,
                        r.valid_from,
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
          Nessuna categoria assegnata.
        </p>
      )}

      {(cats ?? []).length > 0 ? (
        <EntityForm
          action={assignAthleteCategory}
          fields={fields}
          hidden={{ athlete_id: athleteId }}
          submitLabel="Assegna categoria"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Nessuna categoria disponibile: creane in Categorie.
        </p>
      )}
    </section>
  );
}
