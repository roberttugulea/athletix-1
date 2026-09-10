import Link from "next/link";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { WORKOUT_STATUS_LABEL } from "@/lib/validation/workouts";
import { createWorkoutPlan } from "@/server/actions/workouts";
import { planFields } from "./_fields";

export const metadata = { title: "Schede di allenamento | ATHLETIX" };

export default async function SchedeListPage(props: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await props.params;
  const org = await requirePermission("attendance.manage");
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, first_name, last_name")
    .eq("id", athleteId)
    .eq("organization_id", org.organizationId)
    .maybeSingle();
  if (!athlete) notFound();

  const { data: plans } = await supabase
    .from("workout_plans")
    .select("id, title, starts_on, ends_on, status")
    .eq("athlete_id", athleteId)
    .order("starts_on", { ascending: false });

  const who = `${athlete.first_name} ${athlete.last_name}`;

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: `/atleti/${athleteId}`, label: who },
          { label: "Schede di allenamento" },
        ]}
      />
      <PageHeader eyebrow="Allenamento" title={`Schede · ${who}`} />

      {(plans ?? []).length ? (
        <div className="panel mb-6" style={{ overflowX: "auto" }}>
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
        <p className="mb-6 text-xs text-[var(--muted)]">
          Nessuna scheda per questo atleta.
        </p>
      )}

      <h2 className="mb-3 text-sm font-bold">Nuova scheda</h2>
      <EntityForm
        action={createWorkoutPlan}
        fields={planFields}
        defaults={{ status: "active", starts_on: todayISO() }}
        hidden={{ athlete_id: athleteId }}
        submitLabel="Crea scheda"
      />
    </div>
  );
}
