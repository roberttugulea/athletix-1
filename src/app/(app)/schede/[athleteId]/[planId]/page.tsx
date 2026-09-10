import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  addWorkoutItem,
  deleteWorkoutPlan,
  removeWorkoutItem,
  updateWorkoutItem,
  updateWorkoutPlan,
} from "@/server/actions/workouts";
import { itemFields, planFields } from "../_fields";

export const metadata = { title: "Scheda | ATHLETIX" };

type Item = {
  id: string;
  day_index: number;
  exercise: string;
  sets: number | null;
  reps: string | null;
  load: string | null;
  rest_seconds: number | null;
  notes: string | null;
  sort: number;
};

export default async function SchedaDetailPage(props: {
  params: Promise<{ athleteId: string; planId: string }>;
}) {
  const { athleteId, planId } = await props.params;
  const org = await requirePermission("attendance.manage");
  const supabase = await createClient();

  const [{ data: athlete }, { data: plan }, { data: items }] = await Promise.all(
    [
      supabase
        .from("athletes")
        .select("first_name, last_name")
        .eq("id", athleteId)
        .eq("organization_id", org.organizationId)
        .maybeSingle(),
      supabase
        .from("workout_plans")
        .select("id, title, starts_on, ends_on, status, notes")
        .eq("id", planId)
        .eq("organization_id", org.organizationId)
        .maybeSingle(),
      supabase
        .from("workout_plan_items")
        .select(
          "id, day_index, exercise, sets, reps, load, rest_seconds, notes, sort",
        )
        .eq("plan_id", planId)
        .order("day_index")
        .order("sort"),
    ],
  );

  if (!athlete || !plan) notFound();

  const who = `${athlete.first_name} ${athlete.last_name}`;
  const rows = (items ?? []) as Item[];
  const byDay = new Map<number, Item[]>();
  for (const it of rows) {
    if (!byDay.has(it.day_index)) byDay.set(it.day_index, []);
    byDay.get(it.day_index)!.push(it);
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: `/atleti/${athleteId}`, label: who },
          { href: `/schede/${athleteId}`, label: "Schede" },
          { label: plan.title },
        ]}
      />
      <PageHeader eyebrow="Allenamento" title={plan.title} />

      <EntityForm
        action={updateWorkoutPlan}
        fields={planFields}
        defaults={{
          title: plan.title,
          status: plan.status,
          starts_on: plan.starts_on,
          ends_on: plan.ends_on ?? "",
          notes: plan.notes ?? "",
        }}
        hidden={{ id: plan.id, athlete_id: athleteId }}
        submitLabel="Salva scheda"
      />

      <form
        action={deleteWorkoutPlan.bind(null, plan.id, athleteId)}
        className="mt-3"
      >
        <button type="submit" className="text-xs font-semibold text-red-600">
          Elimina scheda
        </button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold">Esercizi</h2>

        {rows.length === 0 ? (
          <p className="mb-4 text-xs text-[var(--muted)]">
            Nessun esercizio. Aggiungine uno qui sotto.
          </p>
        ) : (
          [...byDay.entries()].map(([day, list]) => (
            <div key={day} className="panel mb-3 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                Giorno {day}
              </p>
              <div className="space-y-2">
                {list.map((it) => (
                  <details
                    key={it.id}
                    className="rounded-lg border border-[var(--line)] p-3"
                  >
                    <summary className="cursor-pointer text-sm">
                      <span className="font-semibold">{it.exercise}</span>
                      <span className="ml-2 text-[var(--muted)]">
                        {[
                          it.sets != null ? `${it.sets} serie` : null,
                          it.reps ? `${it.reps} rip` : null,
                          it.load,
                          it.rest_seconds != null
                            ? `rec ${it.rest_seconds}s`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </summary>
                    <div className="mt-3">
                      <EntityForm
                        action={updateWorkoutItem}
                        fields={itemFields}
                        defaults={{
                          day_index: it.day_index,
                          sort: it.sort,
                          exercise: it.exercise,
                          sets: it.sets ?? "",
                          reps: it.reps ?? "",
                          load: it.load ?? "",
                          rest_seconds: it.rest_seconds ?? "",
                          notes: it.notes ?? "",
                        }}
                        hidden={{
                          id: it.id,
                          plan_id: plan.id,
                          athlete_id: athleteId,
                        }}
                        submitLabel="Salva esercizio"
                      />
                      <form
                        action={removeWorkoutItem.bind(
                          null,
                          it.id,
                          plan.id,
                          athleteId,
                        )}
                        className="mt-2"
                      >
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-600"
                        >
                          Rimuovi esercizio
                        </button>
                      </form>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}

        <h3 className="mb-2 mt-6 text-xs font-bold text-[var(--muted)]">
          Aggiungi esercizio
        </h3>
        <EntityForm
          action={addWorkoutItem}
          fields={itemFields}
          defaults={{ day_index: 1, sort: 0 }}
          hidden={{ plan_id: plan.id, athlete_id: athleteId }}
          submitLabel="Aggiungi esercizio"
        />
      </section>
    </div>
  );
}
