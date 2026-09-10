import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { removeResult, upsertResult } from "@/server/actions/competitions";

type ResultRow = {
  id: string;
  discipline: string | null;
  placement: number | null;
  score: number | null;
  notes: string | null;
  athletes: { first_name: string; last_name: string } | null;
  categories: { name: string } | null;
};

export async function ResultsSection({
  competitionId,
  organizationId,
}: {
  competitionId: string;
  organizationId: string;
}) {
  const supabase = await createClient();

  const [{ data: results }, { data: athletes }, { data: categories }] =
    await Promise.all([
      supabase
        .from("competition_results")
        .select(
          "id, discipline, placement, score, notes, athletes(first_name, last_name), categories(name)",
        )
        .eq("competition_id", competitionId)
        .order("placement", { nullsFirst: false }),
      supabase
        .from("athletes")
        .select("id, first_name, last_name")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("last_name"),
      supabase
        .from("categories")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("active", true)
        .order("name"),
    ]);

  const rows = (results ?? []) as unknown as ResultRow[];

  const fields: FieldConfig[] = [
    {
      name: "athlete_id",
      label: "Atleta",
      type: "select",
      required: true,
      options: (athletes ?? []).map((a) => ({
        value: a.id,
        label: `${a.last_name} ${a.first_name}`,
      })),
      width: "full",
    },
    { name: "discipline", label: "Disciplina / specialità" },
    {
      name: "category_id",
      label: "Categoria",
      type: "select",
      options: (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "placement", label: "Piazzamento", type: "number" },
    { name: "score", label: "Punteggio", type: "number" },
    { name: "notes", label: "Note", width: "full" },
  ];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Risultati</h2>

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
                    {[r.discipline, r.categories?.name]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.placement != null ? `${r.placement}°` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {r.score != null ? r.score : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={removeResult.bind(null, r.id, competitionId)}>
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
          Nessun risultato registrato.
        </p>
      )}

      <h3 className="mb-2 text-xs font-bold text-[var(--muted)]">
        Aggiungi risultato
      </h3>
      <EntityForm
        action={upsertResult}
        fields={fields}
        hidden={{ competition_id: competitionId }}
        submitLabel="Salva risultato"
      />
    </section>
  );
}
