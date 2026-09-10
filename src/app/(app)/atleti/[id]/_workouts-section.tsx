import Link from "next/link";

import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { WORKOUT_STATUS_LABEL } from "@/lib/validation/workouts";

export async function WorkoutsSection({ athleteId }: { athleteId: string }) {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("workout_plans")
    .select("id, title, starts_on, ends_on, status")
    .eq("athlete_id", athleteId)
    .order("starts_on", { ascending: false });

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Schede di allenamento</h2>
        <Link
          href={`/schede/${athleteId}`}
          className="text-xs font-semibold text-[var(--blue)]"
        >
          Gestisci schede
        </Link>
      </div>
      {(plans ?? []).length ? (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {(plans ?? []).map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/schede/${athleteId}/${p.id}`}
                      className="text-[var(--blue)]"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    dal {formatShortDate(`${p.starts_on}T12:00:00`)}
                    {p.ends_on
                      ? ` al ${formatShortDate(`${p.ends_on}T12:00:00`)}`
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {WORKOUT_STATUS_LABEL[p.status] ?? p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">Nessuna scheda.</p>
      )}
    </section>
  );
}
